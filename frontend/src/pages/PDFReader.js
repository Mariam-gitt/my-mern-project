import { useState, useRef, useEffect, useCallback } from "react";
import api from "../api";
import Navbar from "../components/Navbar";

function PDFReader() {
    // --- ALL ORIGINAL LOGIC PRESERVED ---
    const canvasRef = useRef(null);
    const fileRef = useRef(null);
    const pdfRef = useRef(null);
    const textLayerRef = useRef(null);
    const [pdfLoaded, setPdfLoaded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
    const [fileName, setFileName] = useState("");
    const [selectedText, setSelectedText] = useState("");
    const [word, setWord] = useState("");
    const [explaining, setExplaining] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [added, setAdded] = useState(false);
    
    // --- NEW UI STATE ---
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // ... (All your existing useEffects, renderPage, loadPDF, etc., remain exactly here) ...

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
            <main className="flex-1 overflow-hidden flex flex-col">
                <Navbar />
                <div className="flex flex-1 overflow-hidden">
                    {/* PDF Viewer Section */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Toolbar ... */}
                        <div className="reader-canvas-container" onMouseUp={handleTextSelection}>
                            {/* PDF Content ... */}
                        </div>
                    </div>

                    {/* Knitting Yarn Ball Loader */}
                    {explaining && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FDFBF7]/90 z-10">
                            <div className="w-16 h-16 rounded-full border-4 border-[#F5C754] animate-spin border-t-transparent"></div>
                            <p className="mt-4 font-serif italic text-[#111111]/70">Knitting context...</p>
                        </div>
                    )}

                    {/* Right Context Panel */}
                    <div className="w-80 border-l-2 border-black p-6 overflow-y-auto bg-[#FDFBF7]">
                        <h3 className="font-serif font-bold text-lg mb-6 border-b border-black pb-2">
                            🔍 Contextual Meaning
                        </h3>
                        {/* Your original logic for displaying results and selection remains here */}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default PDFReader;