import express, { Request, Response } from 'express';
import { PrismaClient } from '../src/generated/prisma';

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

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

app.listen(port, () => {
  console.log(`Servidor em execução na porta ${port}`);
});
