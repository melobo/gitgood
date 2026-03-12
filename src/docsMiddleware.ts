import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { join } from 'path';

export default function docs(): Router {
  const router = Router();

  const swaggerDocument = parse(
    readFileSync(join(__dirname, '..', 'swagger.yaml'), 'utf8')
  );

  router.use('/', swaggerUi.serve);
  router.get('/', swaggerUi.setup(swaggerDocument));

  return router;
}
