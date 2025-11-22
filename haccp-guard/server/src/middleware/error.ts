import { NextFunction, Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'not_found' });
  }
  return res.status(404).render('layouts/404', { title: 'Página não encontrada' });
}

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  const message = err.message || 'Internal error';
  if (req.path.startsWith('/api')) {
    return res.status(status).json({ error: message });
  }
  return res.status(status).render('layouts/error', { title: 'Erro', message });
}
