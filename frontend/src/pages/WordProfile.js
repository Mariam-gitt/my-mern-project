import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";

function WordProfile() {
    // --- YOUR ORIGINAL LOGIC PRESERVED ---
    const { id } = useParams();
    const [wordData, setWordData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // --- NEW UI STATE ---
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        api.get(`/words/${id}`)
            .then(res => setWordData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

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

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20">
                        <div className="w-16 h-16 rounded-full border-4 border-[#F5C754] animate-spin border-t-transparent"></div>
                        <p className="mt-4 font-serif italic text-[#111111]/70">Unraveling word profile...</p>
                    </div>
                ) : wordData ? (
                    <div className="max-w-2xl border-2 border-black p-8 bg-white">
                        <h1 className="text-4xl font-bold mb-4">{wordData.word}</h1>
                        <div className="border-t-2 border-black py-4">
                            <h3 className="font-bold uppercase text-xs tracking-widest mb-2">Definition</h3>
                            <p className="text-lg">{wordData.meaning}</p>
                        </div>
                        <div className="border-t-2 border-black py-4">
                            <h3 className="font-bold uppercase text-xs tracking-widest mb-2">Example</h3>
                            <p className="italic">"{wordData.exampleSentence}"</p>
                        </div>
                        <div className="mt-6">
                            <span className="font-mono text-xs border border-black px-2 py-1">{wordData.status}</span>
                        </div>
                    </div>
                ) : (
                    <p>Word not found.</p>
                )}
            </main>
        </div>
    );
}

export default WordProfile;