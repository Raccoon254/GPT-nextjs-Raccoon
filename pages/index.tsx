import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRef, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import DropDown, { VibeType } from "../components/DropDown";
import Footer from "../components/Footer";
import Github from "../components/GitHub";
import Header from "../components/Header";
import LoadingDots from "../components/LoadingDots";
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";

const Home: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");
  // @ts-ignore
  const [proficiency, setProficiency] = useState<VibeType>("beginner");
  const [generatedProjects, setGeneratedProjects] = useState<String>("");

  const projectRef = useRef<null | HTMLDivElement>(null);

  const scrollToProjects = () => {
    if (projectRef.current !== null) {
      projectRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const prompt = `Generate a project idea for a ${proficiency} level student, the topic is ${topic}`;

  const generateProject = async (e: any) => {
    e.preventDefault();
    setGeneratedProjects("");
    setLoading(true);
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic,
        proficiency,
      }),
    });


    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    const data = response.body;
    if (!data) {
      return;
    }

    const onParse = (event: ParsedEvent | ReconnectInterval) => {
      if (event.type === "event") {
        const data = event.data;
        try {
          const text = JSON.parse(data).text ?? ""
          setGeneratedProjects((prev) => prev + text);
        } catch (e) {
          console.error(e);
        }
      }
    }

    // https://web.dev/streams/#the-getreader-and-read-methods
    const reader = data.getReader();
    const decoder = new TextDecoder();
    const parser = createParser(onParse);
    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      parser.feed(chunkValue);
    }
    scrollToProjects();
    setLoading(false);
  };

  return (
      <div className="flex max-w-5xl mx-auto flex-col items-center justify-center py-2 min-h-screen">
        <Head>
          <title>Project Idea Generator</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <Header />
        <main className="flex flex-1 w-full flex-col items-center justify-center text-center px-4 mt-12 sm:mt-20">
          <a
              className="flex max-w-fit items-center justify-center space-x-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 shadow-md transition-colors hover:bg-gray-100 mb-5"
              href="https://github.com/Nutlope/twitterbio"
              target="_blank"
              rel="noopener noreferrer"
          >
            <Github />
            <p>Star on GitHub</p>
          </a>
          <h1 className="sm:text-6xl text-4xl max-w-[708px] font-bold text-slate-900">
            Generate your next project idea using chatGPT
          </h1>
          <p className="text-slate-500 mt-5">47,118 project ideas generated so far.</p>
          <div className="max-w-xl w-full">
            <div className="flex mt-10 items-center space-x-3">
              <Image
                  src="/1-black.png"
                  width={30}
                  height={30}
                  alt="1 icon"
                  className="mb-5 sm:mb-0"
              />
              <p className="text-left font-medium">
                Select your proficiency level and your topic of interest
              </p>
            </div>
            <div className="block">
              <DropDown vibe={proficiency} setVibe={(newProficiency) => setProficiency(newProficiency)} />
            </div>
            <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black my-5"
                placeholder={
                  "e.g. Web development"
                }
            />
            {!loading && (
                <button
                    className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
                    onClick={(e) => generateProject(e)}
                >
                  Generate your project &rarr;
                </button>
            )}
            {loading && (
                <button
                    className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full"
                    disabled
                >
                  <LoadingDots color="white" style="large" />
                </button>
            )}
          </div>
          <Toaster
              position="top-center"
              reverseOrder={false}
              toastOptions={{ duration: 2000 }}
          />
          <hr className="h-px bg-gray-700 border-1 dark:bg-gray-700" />
          <div className="space-y-10 my-10">
            {generatedProjects && (
                <>
                  <div>
                    <h2
                        className="sm:text-4xl text-3xl font-bold text-slate-900 mx-auto"
                        ref={projectRef}
                    >
                      Your generated projects
                    </h2>
                  </div>
                  <div className="space-y-8 flex flex-col items-center justify-center max-w-xl mx-auto">
                    {generatedProjects
                        .split("\n")
                        .map((generatedProject, index) => {
                          return (
                              <div
                                  className="bg-white rounded-xl shadow-md p-4 hover:bg-gray-100 transition cursor-copy border"
                                  onClick={() => {
                                    navigator.clipboard.writeText(generatedProject);
                                    toast("Project idea copied to clipboard", {
                                      icon: "✂️",
                                    });
                                  }}
                                  key={index}
                              >
                                <p>{generatedProject}</p>
                              </div>
                          );
                        })}
                  </div>
                </>
            )}
          </div>
        </main>
        <Footer />
      </div>
  );
};

export default Home;
