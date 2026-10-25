import type { DemoPracticeFeedback, PracticeQuestion } from "./practice.types";

/** Authored illustrative content, never an imported exam or persisted practice session. */
export const demoPracticeQuestions: PracticeQuestion[] = [
  {
    id: "demo-chess",
    section: "Critical Thinking",
    difficulty: "medium",
    topic: "Detecting Flaws",
    passage: [
      "Psychologists have observed that individuals who play chess regularly tend to score significantly higher on logical reasoning tests than those who do not play the game. This clearly demonstrates that the strategic nature of chess trains the brain to think more analytically and improves one's ability to solve complex problems in real-life situations. If we want to improve the academic performance of our students, we should make chess a mandatory part of the primary school curriculum. By doing so, we will ensure that the next generation is equipped with the critical thinking skills necessary for modern careers.",
    ],
    prompt: "Which of the following identifies the flaw in the reasoning?",
    options: [
      {
        id: "A",
        text: "It assumes that academic performance is solely dependent on logical reasoning skills.",
      },
      {
        id: "B",
        text: "It fails to consider that other games, like bridge or go, might be equally effective at training the brain.",
      },
      {
        id: "C",
        text: "It ignores the possibility that people who are already naturally logical are more likely to be drawn to chess.",
      },
      {
        id: "D",
        text: "It assumes that students will enjoy playing chess enough to learn from it.",
      },
      {
        id: "E",
        text: "It relies on a sample of students that may not be representative of the entire population.",
      },
    ],
  },
  {
    id: "demo-library",
    section: "Critical Thinking",
    difficulty: "easy",
    topic: "Detecting Flaws",
    passage: [
      "A school found that students who borrowed more books from its library achieved higher examination marks than students who borrowed fewer books. The headteacher concluded that borrowing books causes better examination results. To improve results next year, every student will therefore be required to borrow at least one book each week.",
      "The school has not investigated whether the students read the books they borrow or whether these students already spend more time studying.",
    ],
    prompt:
      "Which of the following best explains the weakness in the headteacher's argument?",
    options: [
      { id: "A", text: "Some students might prefer to buy their own books." },
      {
        id: "B",
        text: "Students who are more motivated may both borrow more books and achieve higher marks.",
      },
      { id: "C", text: "The library might need to buy additional books." },
      { id: "D", text: "Not all examinations assess the same subjects." },
      { id: "E", text: "Borrowing a book every week may be inconvenient." },
    ],
  },
  {
    id: "demo-cycling",
    section: "Critical Thinking",
    difficulty: "hard",
    topic: "Detecting Flaws",
    passage: [
      "After a city introduced a new cycle lane, the number of people cycling to work increased. A councillor said that the cycle lane must have caused the increase and that building identical lanes throughout the city would produce the same result everywhere.",
      "During the same period, the city's largest employer began paying staff a cycling allowance, and several major roads were closed for repairs.",
    ],
    prompt:
      "Which of the following identifies the main flaw in the councillor's reasoning?",
    options: [
      {
        id: "A",
        text: "It assumes that all residents have access to a bicycle.",
      },
      {
        id: "B",
        text: "It overlooks the cost of building additional cycle lanes.",
      },
      {
        id: "C",
        text: "It assumes that cycling is the fastest way to travel to work.",
      },
      {
        id: "D",
        text: "It does not rule out other changes that could explain the increase in cycling.",
      },
      { id: "E", text: "It does not compare cycling with walking." },
    ],
  },
];

export const demoPracticeFeedback: Record<string, DemoPracticeFeedback> = {
  "demo-chess": {
    correctOptionId: "C",
    explanation:
      "The observation shows a correlation, not that chess caused better reasoning. People with stronger logical reasoning may be more likely to choose chess in the first place. Without ruling out that possibility, the argument cannot conclude that making chess compulsory will improve those skills.",
  },
  "demo-library": {
    correctOptionId: "B",
    explanation:
      "Motivation could explain both the borrowing and the higher marks. Requiring students to borrow books does not establish that they will read them, become more motivated, or improve their results.",
  },
  "demo-cycling": {
    correctOptionId: "D",
    explanation:
      "The cycling allowance and road closures are alternative explanations for the increase. The argument attributes the whole change to the cycle lane without separating its effect from those other changes.",
  },
};
