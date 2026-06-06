import { Router } from "express";
import { db } from "@workspace/db";
import { questionsTable, answersTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import { CreateQuestionBody, AddAnswerBody, AddAnswerParams } from "@workspace/api-zod";

const router = Router();

router.get("/qa", async (req, res) => {
  const { category, search } = req.query as { category?: string; search?: string };

  let questions = await db.select().from(questionsTable).orderBy(questionsTable.createdAt);

  if (category) {
    questions = questions.filter(q => q.category === category);
  }
  if (search) {
    const s = search.toLowerCase();
    questions = questions.filter(q =>
      q.title.toLowerCase().includes(s) || q.body.toLowerCase().includes(s)
    );
  }

  const questionsWithAnswers = await Promise.all(
    questions.map(async (q) => {
      const answers = await db.select().from(answersTable).where(eq(answersTable.questionId, q.id));
      return { ...q, answers, answersCount: answers.length, createdAt: q.createdAt.toISOString() };
    })
  );

  res.json(questionsWithAnswers);
});

router.post("/qa", async (req, res) => {
  const parse = CreateQuestionBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid input" });

  const [question] = await db.insert(questionsTable).values(parse.data).returning();
  res.status(201).json({ ...question, answers: [], answersCount: 0, createdAt: question.createdAt.toISOString() });
});

router.post("/qa/:id/answers", async (req, res) => {
  const parseParams = AddAnswerParams.safeParse({ id: Number(req.params.id) });
  if (!parseParams.success) return res.status(400).json({ error: "Invalid ID" });

  const parseBody = AddAnswerBody.safeParse(req.body);
  if (!parseBody.success) return res.status(400).json({ error: "Invalid input" });

  const [answer] = await db.insert(answersTable).values({
    questionId: parseParams.data.id,
    ...parseBody.data,
  }).returning();

  res.status(201).json({ ...answer, createdAt: answer.createdAt.toISOString() });
});

export default router;
