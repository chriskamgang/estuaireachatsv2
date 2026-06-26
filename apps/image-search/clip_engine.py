"""
Moteur CLIP pour la recherche visuelle de produits.
Utilise le modele ViT-B-32 (le plus leger, ~400MB RAM).
"""

import logging
import os
from io import BytesIO
from typing import Optional

import httpx
import numpy as np
import open_clip
import torch
from PIL import Image

logger = logging.getLogger(__name__)


class CLIPEngine:
    """Moteur de recherche visuelle base sur CLIP (ViT-B-32)."""

    def __init__(self):
        self.model = None
        self.preprocess = None
        self.tokenizer = None
        self.device = "cpu"

        # Donnees d'embeddings pre-calcules
        self.product_embeddings: Optional[np.ndarray] = None  # (N, dim) float32
        self.product_ids: Optional[list[str]] = None
        self.image_urls: Optional[list[str]] = None

    def load_model(self):
        """Charge le modele CLIP ViT-B-32 (petit et rapide)."""
        logger.info("Chargement du modele CLIP ViT-B-32...")
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            "ViT-B-32", pretrained="laion2b_s34b_b79k"
        )
        self.model.eval()
        self.tokenizer = open_clip.get_tokenizer("ViT-B-32")
        logger.info("Modele CLIP charge avec succes.")

    def compute_embedding(self, image: Image.Image) -> np.ndarray:
        """Calcule l'embedding CLIP d'une seule image."""
        image_tensor = self.preprocess(image).unsqueeze(0).to(self.device)
        with torch.no_grad():
            embedding = self.model.encode_image(image_tensor)
            # Normaliser le vecteur (pour similarite cosinus)
            embedding = embedding / embedding.norm(dim=-1, keepdim=True)
        return embedding.cpu().numpy().flatten()

    def load_embeddings(self, cache_path: str) -> bool:
        """Charge les embeddings pre-calcules depuis un fichier .npz."""
        if not os.path.exists(cache_path):
            logger.warning("Fichier cache '%s' introuvable.", cache_path)
            return False

        try:
            data = np.load(cache_path, allow_pickle=True)
            self.product_embeddings = data["embeddings"]
            self.product_ids = data["product_ids"].tolist()
            self.image_urls = data["image_urls"].tolist()
            logger.info(
                "Cache charge : %d embeddings depuis '%s'.",
                len(self.product_ids),
                cache_path,
            )
            return True
        except Exception as e:
            logger.error("Erreur lors du chargement du cache : %s", e)
            return False

    def save_embeddings(self, cache_path: str):
        """Sauvegarde les embeddings dans un fichier .npz."""
        if self.product_embeddings is None:
            logger.warning("Aucun embedding a sauvegarder.")
            return

        np.savez_compressed(
            cache_path,
            embeddings=self.product_embeddings,
            product_ids=np.array(self.product_ids, dtype=object),
            image_urls=np.array(self.image_urls, dtype=object),
        )
        logger.info(
            "Cache sauvegarde : %d embeddings dans '%s'.",
            len(self.product_ids),
            cache_path,
        )

    def search(self, query_embedding: np.ndarray, top_k: int = 20) -> list[dict]:
        """
        Recherche par similarite cosinus.
        Retourne une liste de dicts : { productId, similarity, imageUrl }
        """
        if self.product_embeddings is None or len(self.product_ids) == 0:
            logger.warning("Aucun embedding indexe. Lancez /reindex d'abord.")
            return []

        # Similarite cosinus (les embeddings sont deja normalises)
        similarities = self.product_embeddings @ query_embedding

        # Trier par similarite decroissante
        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        seen_products = set()
        for idx in top_indices:
            pid = self.product_ids[idx]
            # Dedupliquer par productId (garder la meilleure image)
            if pid in seen_products:
                continue
            seen_products.add(pid)
            results.append(
                {
                    "productId": pid,
                    "similarity": round(float(similarities[idx]), 4),
                    "imageUrl": self.image_urls[idx],
                }
            )
            if len(results) >= top_k:
                break

        return results

    async def reindex(self, db_url: str, cache_path: str):
        """
        Re-indexe toutes les images produits :
        1. Recupere les URLs depuis la base PostgreSQL
        2. Telecharge chaque image
        3. Calcule l'embedding CLIP
        4. Sauvegarde le cache
        """
        import psycopg2

        # Convertir l'URL SQLAlchemy/Prisma en format psycopg2 si necessaire
        conn_url = db_url
        if conn_url.startswith("postgresql://"):
            pass  # deja compatible
        elif conn_url.startswith("postgres://"):
            conn_url = conn_url.replace("postgres://", "postgresql://", 1)

        logger.info("Connexion a la base de donnees...")
        conn = psycopg2.connect(conn_url)
        cur = conn.cursor()

        # Recuperer toutes les images produits (table product_images du schema Prisma)
        cur.execute(
            'SELECT id, "productId", url FROM product_images ORDER BY "productId"'
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        total = len(rows)
        logger.info("Trouvees %d images produits a indexer.", total)

        if total == 0:
            logger.warning("Aucune image trouvee dans la base.")
            return

        embeddings_list = []
        product_ids_list = []
        image_urls_list = []
        errors = 0

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            for i, (img_id, product_id, url) in enumerate(rows):
                try:
                    # Telecharger l'image
                    resp = await client.get(url)
                    resp.raise_for_status()

                    # Ouvrir et convertir en RGB
                    image = Image.open(BytesIO(resp.content)).convert("RGB")

                    # Calculer l'embedding
                    emb = self.compute_embedding(image)

                    embeddings_list.append(emb)
                    product_ids_list.append(product_id)
                    image_urls_list.append(url)

                    if (i + 1) % 50 == 0 or (i + 1) == total:
                        logger.info("Progression : %d/%d images traitees.", i + 1, total)

                except Exception as e:
                    errors += 1
                    logger.warning(
                        "Erreur image %s (produit %s) : %s", img_id, product_id, e
                    )
                    continue

        if len(embeddings_list) == 0:
            logger.error("Aucun embedding calcule. Verifiez les URLs des images.")
            return

        # Stocker les resultats
        self.product_embeddings = np.array(embeddings_list, dtype=np.float32)
        self.product_ids = product_ids_list
        self.image_urls = image_urls_list

        # Sauvegarder le cache
        self.save_embeddings(cache_path)

        logger.info(
            "Indexation terminee : %d images indexees, %d erreurs.",
            len(embeddings_list),
            errors,
        )
