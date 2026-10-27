import { Inter } from "next/font/google";
import Link from "next/link";
import { PublicSiteShell } from "../../components/public-site-shell";
import { contactChannels } from "../contact/contact.config";
import { NuetReveal } from "./nuet-reveal";
import "./nuet.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-nuet",
});

const telegramHref = contactChannels.find(({ id }) => id === "telegram")?.href;

function NuetHero() {
  return (
    <section className="hero">
      <div className="w">
        <h1 id="nuet-title">What is NUET?</h1>
        <p className="lead rv">
          NUET is the Nazarbayev University Entrance Test: a multiple-choice
          exam in Mathematics and Critical Thinking &amp; Problem Solving that
          applicants take to continue in the university’s admission competition.
        </p>
        <div className="cta rv">
          <a className="btn b-r" href="#prepare">
            Where to prepare
          </a>
          <a className="btn b-mute" href="#structure">
            See the format
          </a>
        </div>
      </div>
      <div className="facts">
        <div className="w g">
          <div className="rv">
            <b>2</b>
            <span>
              sections: Mathematics, and Critical Thinking &amp; Problem Solving
            </span>
          </div>
          <div className="rv">
            <b>60</b>
            <span>multiple-choice questions, 30 per section</span>
          </div>
          <div className="rv">
            <b>120</b>
            <span>minutes in total, 60 per section</span>
          </div>
          <div className="rv">
            <b>0–120</b>
            <span>standardised score scale for each section</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function NuetOverview() {
  return (
    <section id="about">
      <div className="w two">
        <div className="t">
          <h2>One test, two ways in.</h2>
          <div className="rv nuet-about-copy">
            <p>
              NUET is a standardised admission examination developed by an
              international university partner for Nazarbayev University. It
              checks academic readiness for studying at NU.
            </p>
            <p>
              Applicants in the “NUET applicants” category sit it for the
              Foundation Year Program (NUFYP) and for undergraduate programs.
              Someone applying to both takes it once, and both admission
              committees see that one result. Passing it lets you stay in the
              admission competition.
            </p>
          </div>
        </div>
        <div className="stack rv">
          <div>
            <b>What it measures</b>Mathematics, plus reasoning with everyday
            language, numbers, diagrams and tables.
          </div>
          <div>
            <b>How you take it</b>On an NU-set date in a city you choose in your
            application. Results appear in your personal account about six weeks
            later.
          </div>
          <div>
            <b>Two sections, three skills</b>NU lists Critical Thinking &amp;
            Problem Solving as one section. It contains two distinct kinds of
            questions, covered below.
          </div>
        </div>
      </div>
    </section>
  );
}

function NuetStructure() {
  return (
    <section id="structure">
      <div className="w">
        <h2>The exam at a glance.</h2>
        <div className="bar rv">
          <div className="seg m">
            <div>
              <h3>Mathematics</h3>
            </div>
            <div className="n">30 Q</div>
            <ul>
              <li>60 minutes</li>
              <li>Multiple choice</li>
              <li>Scored 0–120</li>
            </ul>
          </div>
          <div className="seg c">
            <div>
              <h3>Critical Thinking &amp; Problem Solving</h3>
            </div>
            <div className="n">30 Q</div>
            <ul>
              <li>60 minutes</li>
              <li>Multiple choice</li>
              <li>Scored 0–120</li>
            </ul>
          </div>
        </div>
        <div className="tl" aria-hidden="true">
          <span>0 min</span>
          <span>60</span>
          <span>120 min</span>
        </div>
        <div className="notes">
          <div className="rv">
            <b>Format</b>Every question is multiple choice. Both sections are
            the same length.
          </div>
          <div className="rv">
            <b>Can it change?</b>NU’s admission policy says the number of tasks
            and the duration may be changed by the test administrator. Check
            your exam notice.
          </div>
          <div className="rv">
            <b>Before exam day</b>NU emails the date, venue, format, documents
            and rules about five days ahead.
          </div>
        </div>
        <div className="src">
          <a
            href="https://cps.nu.edu.kz/admissions"
            target="_blank"
            rel="noopener noreferrer"
          >
            NU Center for Preparatory Studies: NUET page
          </a>
          <a
            href="https://nu.edu.kz/wp-content/uploads/2026/04/admission-policy-and-procedures-to-the-nazarbayev-university-foundation-year-program-and-undergraduate-program-of-nu-1.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Admission Policy and Procedures (PDF)
          </a>
        </div>
      </div>
    </section>
  );
}

function NuetSubjects() {
  return (
    <section id="subjects">
      <div className="w">
        <h2>What each section asks.</h2>
        <p className="lead nuet-subject-lead">
          Open a section to see its question types and the knowledge behind
          them.
        </p>
        <div className="subj">
          <details className="rv">
            <summary>
              <div>
                <h3>Critical Thinking</h3>
                <p>
                  Reasoning with everyday written language: you read a short
                  argument and judge it.
                </p>
              </div>
              <span className="pm" aria-hidden="true"></span>
            </summary>
            <div className="body">
              <div className="full">
                Each question gives a passage, a question and five options. You
                treat the reasons in the passage as true and decide what follows
                from them. Seven question types appear:
              </div>
              <div>
                <b>Summarising the main conclusion</b>Find the point the
                argument wants you to accept.
              </div>
              <div>
                <b>Drawing a conclusion</b>Pick what the passage best supports.
              </div>
              <div>
                <b>Identifying an assumption</b>Spot the unstated step the
                argument relies on.
              </div>
              <div>
                <b>Assessing additional evidence</b>Decide what would strengthen
                or weaken the argument.
              </div>
              <div>
                <b>Detecting reasoning errors</b>Name the flaw in how reasons
                lead to the conclusion.
              </div>
              <div>
                <b>Matching arguments</b>Find the argument with the same
                structure, whatever its topic.
              </div>
              <div>
                <b>Applying principles</b>Choose the case that follows the same
                underlying principle.
              </div>
            </div>
          </details>

          <details className="rv">
            <summary>
              <div>
                <h3>Problem Solving</h3>
                <p>
                  Reasoning with numbers, space, tables and graphs, on problems
                  you have not seen before.
                </p>
              </div>
              <span className="pm" aria-hidden="true"></span>
            </summary>
            <div className="body">
              <div className="full">
                The stimulus may be a diagram, a table (like a timetable) or a
                graph. Three question types appear, and some questions combine
                them:
              </div>
              <div>
                <b>Relevant selection</b>Pick out the information that matters
                from a crowded problem.
              </div>
              <div>
                <b>Finding procedures</b>Work out which operations to apply to
                the numbers given.
              </div>
              <div>
                <b>Identifying similarity</b>Choose the situation that uses the
                same method.
              </div>
              <div className="full">
                <b>Knowledge it draws on</b>Number concepts (fractions, place
                value, percentages) · numerical operations in everyday contexts
                · quantities (time, money, standard measures) · area, perimeter,
                volume, reflections, rotations and 2D views of 3D shapes ·
                simple generalisation · reading tables and graphs. Formal
                algebra is not required here.
              </div>
              <div className="full">
                <b>How it differs from Critical Thinking</b>Critical Thinking
                judges arguments written in words. Problem Solving works out
                answers from numbers, shapes and data.
              </div>
            </div>
          </details>

          <details className="rv">
            <summary>
              <div>
                <h3>Mathematics</h3>
                <p>
                  The second NUET section: 30 multiple-choice questions in 60
                  minutes.
                </p>
              </div>
              <span className="pm" aria-hidden="true"></span>
            </summary>
            <div className="body">
              <div className="full">
                <b>Topic list: see the official PDF</b>NU publishes the topic
                groups and sub-topics in its “NUET 2026 Mathematics
                Specification”. We could not open that file while building this
                page, so we do not list topics from memory. Open it below and
                work through it group by group.
              </div>
            </div>
          </details>
        </div>
        <div className="src">
          <a
            href="https://drive.google.com/file/d/1kU4ydcpfieJLa6bA3iHa9Z_VFOjXtE5e/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
          >
            NUET 2026 Mathematics Specification
          </a>
          <a
            href="https://drive.google.com/file/d/1qGvW5QoqHjiGsxfEBKPF--I7AZBjQ_m-/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
          >
            NUET 2026 Critical Thinking &amp; Problem Solving Specification
          </a>
        </div>
      </div>
    </section>
  );
}

function NuetPreparation() {
  return (
    <section id="prepare">
      <div className="w">
        <h2>Not sure where to prepare?</h2>
        <div className="prep">
          <div className="card tg rv">
            <div>
              <h3>Join our Telegram community</h3>
              <p>
                Follow the Justprepy channel for NUET preparation content and
                community updates.
              </p>
            </div>
            <a
              className="btn b-w"
              href={telegramHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join on Telegram
            </a>
          </div>
          <div className="card jp rv">
            <div>
              <h3>Practice on Justprepy</h3>
              <p>
                Solve NUET-style questions in the Question Bank, section by
                section.
              </p>
            </div>
            <Link className="btn b-w" href="/">
              Start Practicing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function NuetPage() {
  return (
    <PublicSiteShell page="nuet">
      <NuetReveal fontClassName={inter.variable}>
        <NuetHero />
        <NuetOverview />
        <NuetStructure />
        <NuetSubjects />
        <NuetPreparation />
      </NuetReveal>
    </PublicSiteShell>
  );
}
