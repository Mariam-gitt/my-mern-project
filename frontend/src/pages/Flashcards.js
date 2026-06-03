import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";

function Flashcards() {
    // --- YOUR ORIGINAL LOGIC PRESERVED ---
    const [words, setWords] = useState([]);
    const [index, setIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    
    // --- NEW UI STATE ---
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        api.get("/words").then(res => setWords(res.data)).catch(console.log);
    }, []);

    if (words.length === 0) return (
        <div className="flex h-screen w-full bg-[#FDFBF7] overflow-hidden">
            <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-[#FDFBF7] border-r-2 border-black transition-all duration-300 flex flex-col`}>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-4 text-left font-mono text-xs font-bold border-b border-black hover:bg-[#F5C754]">
                    {sidebarOpen ? "« CLOSE" : "»"}
                </button>
            </aside>
            <main className="flex-1 overflow-y-auto">
                <Navbar />
                <div className="p-6">
                    <div className="border-2 border-black p-8 text-center">
                        <div className="text-4xl mb-4">▣</div>
                        <p>Add some words first to start reviewing.</p>
                    </div>
                </div>
            </main>
        </div>
    );

    const word = words[index];
    const nextCard = () => { setFlipped(false); setTimeout(() => setIndex(p => (p + 1) % words.length), 150); };
    const prevCard = () => { setFlipped(false); setTimeout(() => setIndex(p => (p - 1 + words.length) % words.length), 150); };

    return (
        <div className="flex h-screen w-full bg-[#FDFBF7] overflow-hidden">
            {/* Moveable Sidebar */}
            <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-[#FDFBF7] border-r-2 border-black transition-all duration-300 flex flex-col`}>
                <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-4 text-left font-mono text-xs font-bold border-b border-black hover:bg-[#F5C754]"
                >
                    {sidebarOpen ? "« CLOSE" : "»"}
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6">
                <Navbar />
                <div className="max-w-xl mx-auto mt-10">
                    <div className="border-b-2 border-black mb-8 pb-4 text-center">
                        <h2 className="font-bold text-xl">Flashcards</h2>
                        <p className="text-sm italic">Click card to reveal meaning</p>
                    </div>

                    <div className="border-2 border-black p-10 min-h-[300px] flex items-center justify-center cursor-pointer bg-white" onClick={() => setFlipped(!flipped)}>
                        <div className={`transition-transform duration-500 ${flipped ? "rotate-y-180" : ""}`}>
                            {!flipped ? (
                                <div className="text-center">
                                    <h1 className="text-3xl font-bold">{word.word}</h1>
                                    <p className="mt-4 text-xs font-mono">Click to reveal</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="text-lg font-serif">{word.meaning}</p>
                                    {word.exampleSentence && word.exampleSentence !== "No example available" && (
                                        <p className="mt-4 italic text-sm">"{word.exampleSentence}"</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                        <button className="border border-black px-4 py-2 hover:bg-[#F5C754]" onClick={prevCard}>← Prev</button>
                        <span className="font-mono text-sm">{index + 1} / {words.length}</span>
                        <button className="bg-[#F5C754] border-2 border-black px-4 py-2 font-bold" onClick={nextCard}>Next →</button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Flashcards;