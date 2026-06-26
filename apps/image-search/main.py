"""
Microservice FastAPI de recherche visuelle de produits par CLIP.
Utilise le modele ViT-B-32 pour comparer les images par similarite.
"""

import logging
import os
from contextlib import asynccontextmanager
from io import BytesIO

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image

from clip_engine import CLIPEngine

# Charger les variables d'environnement
load_dotenv()

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Chemins et configuration
DATABASE_URL = os.getenv("DATABASE_URL", "")
PORT = int(os.getenv("PORT", "8050"))
CACHE_PATH = os.getenv("EMBEDDINGS_CACHE_PATH", "./embeddings_cache.npz")

# Instance globale du moteur CLIP
engine = CLIPEngine()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Evenement de demarrage : charge le modele et le cache d'embeddings."""
    engine.load_model()
    engine.load_embeddings(CACHE_PATH)
    yield
    logger.info("Arret du microservice de recherche visuelle.")


app = FastAPI(
    title="EstuaireAchats — Recherche Visuelle",
    description="Recherche de produits similaires par image via CLIP (ViT-B-32)",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    """Verification de l'etat du service."""
    nb_indexed = len(engine.product_ids) if engine.product_ids else 0
    return {
        "status": "ok",
        "model_loaded": engine.model is not None,
        "indexed_images": nb_indexed,
    }


@app.post("/search")
async def search(file: UploadFile = File(...)):
    """
    Recherche visuelle : uploade une image et retourne les 20 produits les plus similaires.
    Accepte un fichier image en multipart/form-data.
    """
    if engine.model is None:
        raise HTTPException(status_code=503, detail="Le modele CLIP n'est pas encore charge.")

    if engine.product_embeddings is None or len(engine.product_ids) == 0:
        raise HTTPException(
            status_code=503,
            detail="Aucun embedding indexe. Appelez POST /reindex d'abord.",
        )

    try:
        # Lire et ouvrir l'image uploadee
        contents = await file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image invalide : {e}")

    # Calculer l'embedding de l'image requete
    query_embedding = engine.compute_embedding(image)

    # Recherche par similarite cosinus
    results = engine.search(query_embedding, top_k=20)

    return {"results": results}


@app.post("/reindex")
async def reindex():
    """
    Re-indexe toutes les images produits depuis la base de donnees.
    Telecharge chaque image, calcule son embedding CLIP, et sauvegarde le cache.
    Peut prendre plusieurs minutes selon le nombre de produits.
    """
    if engine.model is None:
        raise HTTPException(status_code=503, detail="Le modele CLIP n'est pas encore charge.")

    if not DATABASE_URL:
        raise HTTPException(
            status_code=500,
            detail="DATABASE_URL non configuree dans le fichier .env",
        )

    logger.info("Debut de la re-indexation...")
    await engine.reindex(DATABASE_URL, CACHE_PATH)
    nb_indexed = len(engine.product_ids) if engine.product_ids else 0

    return {
        "status": "ok",
        "message": f"Re-indexation terminee : {nb_indexed} images indexees.",
        "indexed_images": nb_indexed,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
