import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard JWT optionnel : si un token valide est present, req.user est rempli.
 * Sinon, la requete passe quand meme (req.user = undefined).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    // Ne leve pas d'erreur si le token est absent ou invalide
    return user || null;
  }
}
