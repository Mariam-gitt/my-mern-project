


import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Register() {
    // --- YOUR ORIGINAL LOGIC PRESERVED ---
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // --- NEW UI STATE ---
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            await api.post("/auth/register", { name, email, password });
            navigate("/");
        } catch {
            setError("Registration failed. Please try again.");
        } finally { setLoading(false); }
    };

    return (
        <div className="flex h-screen w-full bg-[#FDFBF7]">
            {/* Moveable Sidebar (Static on Auth) */}
            <aside className={`${sidebarOpen ? "w-64" : "w-16"} bg-[#FDFBF7] border-r-2 border-black transition-all duration-300 flex flex-col`}>
                <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-4 text-left font-mono text-xs font-bold border-b border-black hover:bg-[#F5C754]"
                >
                    {sidebarOpen ? "« CLOSE" : "»"}
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-6">
                <form onSubmit={handleRegister} className="w-full max-w-sm border-2 border-black p-8 bg-white">
                    <h1 className="text-2xl font-bold mb-6">Create Account</h1>
                    
                    {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
                    
                    <input 
                        placeholder="Name" 
                        className="w-full border border-black p-2 mb-4"
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <input 
                        type="email" 
                        placeholder="Email" 
                        className="w-full border border-black p-2 mb-4"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        className="w-full border border-black p-2 mb-6"
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    
                    <button 
                        type="submit" 
                        className="w-full bg-[#F5C754] border-2 border-black p-2 font-bold hover:bg-[#e0b54b]" 
                        disabled={loading}
                    >
                        {loading ? "Knitting account..." : "Register"}
                    </button>
                </form>
            </main>
        </div>
    );
}

export default Register;