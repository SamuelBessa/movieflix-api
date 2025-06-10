import express, { Request, Response } from 'express';
import { PrismaClient } from '../src/generated/prisma';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json';

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/movies', async (_, res) => {
  const movies = await prisma.movie.findMany({
    orderBy: {
      title: 'asc',
    },
    include: {
      genres: true,
      languages: true,
    },
  });
  res.json(movies);
});

app.post('/movies', async (req: Request, res: Response) => {
  const { title, genre_id, language_id, oscar_count, release_date } = req.body;

  try {
    const movieWithSameTitle = await prisma.movie.findFirst({
      where: {
        title: { equals: title, mode: 'insensitive' },
      },
    });

    if (movieWithSameTitle) {
      res.status(409).send({ message: 'Já existe um filme com esse título' });
      return;
    }

    await prisma.movie.create({
      data: {
        title,
        genre_id,
        language_id,
        oscar_count,
        release_date: new Date(release_date),
      },
    });

    res.status(201).send();
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Falha ao cadastrar um filme' });
  }
});

app.put('/movies/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  try {
    const movie = await prisma.movie.findUnique({ where: { id } });

    if (!movie) {
      res.status(404).send({ message: 'Filme não encontrado' });
      return;
    }

    const data = { ...req.body };
    data.release_date = data.release_date
      ? new Date(data.release_date)
      : undefined;

    await prisma.movie.update({
      where: { id },
      data,
    });

    res.status(200).send();
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Falha ao atualizar o filme' });
  }
});

app.delete('/movies/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  try {
    const movie = await prisma.movie.findUnique({ where: { id } });

    if (!movie) {
      res.status(404).send({ message: 'Filme não encontrado' });
      return;
    }

    await prisma.movie.delete({ where: { id } });

    res.status(200).send({ message: 'Filme excluído com sucesso' });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'Falha ao excluir o filme' });
  }
});

app.get('/movies/:genreName', async (req: Request, res: Response) => {
  try {
    const moviesFilteredByGenreName = await prisma.movie.findMany({
      include: {
        genres: true,
        languages: true,
      },

      where: {
        genres: {
          name: {
            equals: req.params.genreName,
            mode: 'insensitive',
          },
        },
      },
    });

    res.status(200).send(moviesFilteredByGenreName);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error ao buscar filmes por gênero' });
  }
});

app.listen(port, () => {
  console.log(`Servidor em execução na porta ${port}`);
});
