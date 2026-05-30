import { useMemo } from "react";

function VocabTree({ totalWords = 0, learnedWords = 0 }) {

    const stage = useMemo(() => {
        if (totalWords === 0) return 0;
        if (totalWords <= 10) return 1;
        if (totalWords <= 25) return 2;
        if (totalWords <= 50) return 3;
        if (totalWords <= 100) return 4;
        if (totalWords <= 200) return 5;
        if (totalWords <= 400) return 6;
        if (totalWords <= 700) return 7;
        return 8;
    }, [totalWords]);

    // Color based on learned ratio
    const learnedRatio = totalWords > 0 ? learnedWords / totalWords : 0;
    const leafColor = useMemo(() => {
        if (learnedRatio > 0.7) return { dark: "#2d7a35", mid: "#3d9e47", light: "#52c45a" };
        if (learnedRatio > 0.4) return { dark: "#4a9d50", mid: "#5aad5e", light: "#7bc67e" };
        return { dark: "#7aaa45", mid: "#94c25a", light: "#b5d97a" }; // yellowish = needs review
    }, [learnedRatio]);

    const STAGE_INFO = [
        { label: "Plant your first word", emoji: "🌱", desc: "Your journey begins here" },
        { label: "Seedling", emoji: "🌱", desc: `${totalWords} word sprouting` },
        { label: "Sapling", emoji: "🌿", desc: `${totalWords} words growing` },
        { label: "Young Tree", emoji: "🌳", desc: `${totalWords} words flourishing` },
        { label: "Full Tree", emoji: "🌳", desc: `${totalWords} words blooming` },
        { label: "Fruitful Tree", emoji: "🍎", desc: `${totalWords} words bearing fruit` },
        { label: "Ancient Tree", emoji: "🌲", desc: `${totalWords} words — deeply rooted` },
        { label: "Grove", emoji: "🌲🌲", desc: `${totalWords} words — a grove grows` },
        { label: "Magical Forest", emoji: "🌲🌲🌲", desc: `${totalWords} words — legendary!` },
    ];

    const info = STAGE_INFO[stage];

    return (
        <div className="vocab-tree-container">
            <svg viewBox="0 0 300 260" className="vocab-tree-svg" xmlns="http://www.w3.org/2000/svg">

                {/* Sky background */}
                <defs>
                    <radialGradient id="skyGrad" cx="50%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#e8f4fd" stopOpacity="0.6"/>
                        <stop offset="100%" stopColor="#f5f9ff" stopOpacity="0"/>
                    </radialGradient>
                    <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FFD93D" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#FFD93D" stopOpacity="0"/>
                    </radialGradient>
                    <filter id="softBlur">
                        <feGaussianBlur stdDeviation="1.5"/>
                    </filter>
                </defs>

                {/* Ground */}
                <ellipse cx="150" cy="238" rx="120" ry="14" fill="#c8b89a" opacity="0.4"/>
                <ellipse cx="150" cy="235" rx="100" ry="10" fill="#b5a07a" opacity="0.3"/>

                {/* Stage 0 — bare soil + seed */}
                {stage === 0 && (
                    <g>
                        <circle cx="150" cy="228" r="6" fill="#8B7355"/>
                        <line x1="150" y1="222" x2="150" y2="210" stroke="#8B7355" strokeWidth="1.5" strokeLinecap="round"/>
                        {/* tiny sprout lines */}
                        <line x1="150" y1="215" x2="142" y2="208" stroke="#7aaa45" strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="150" y1="213" x2="158" y2="207" stroke="#7aaa45" strokeWidth="1.5" strokeLinecap="round"/>
                    </g>
                )}

                {/* Stage 1 — seedling */}
                {stage === 1 && (
                    <g>
                        <line x1="150" y1="235" x2="150" y2="200" stroke="#6B8E4E" strokeWidth="3" strokeLinecap="round"/>
                        <ellipse cx="138" cy="208" rx="12" ry="6" fill={leafColor.light} transform="rotate(-35 138 208)"/>
                        <ellipse cx="163" cy="211" rx="12" ry="6" fill={leafColor.light} transform="rotate(35 163 211)"/>
                        <ellipse cx="150" cy="196" rx="9" ry="14" fill={leafColor.mid}/>
                    </g>
                )}

                {/* Stage 2 — sapling */}
                {stage === 2 && (
                    <g>
                        <rect x="146" y="195" width="8" height="42" rx="3" fill="#8B6914"/>
                        <line x1="150" y1="218" x2="126" y2="204" stroke="#8B6914" strokeWidth="4" strokeLinecap="round"/>
                        <line x1="150" y1="213" x2="174" y2="202" stroke="#8B6914" strokeWidth="3.5" strokeLinecap="round"/>
                        <circle cx="150" cy="182" r="30" fill={leafColor.dark} opacity="0.85"/>
                        <circle cx="126" cy="192" r="20" fill={leafColor.mid} opacity="0.9"/>
                        <circle cx="174" cy="190" r="20" fill={leafColor.mid} opacity="0.9"/>
                        <circle cx="150" cy="164" r="22" fill={leafColor.light} opacity="0.9"/>
                    </g>
                )}

                {/* Stage 3 — young tree */}
                {stage === 3 && (
                    <g>
                        <rect x="143" y="182" width="14" height="54" rx="5" fill="#7a5c1e"/>
                        <line x1="150" y1="215" x2="112" y2="196" stroke="#7a5c1e" strokeWidth="6" strokeLinecap="round"/>
                        <line x1="150" y1="207" x2="188" y2="191" stroke="#7a5c1e" strokeWidth="5" strokeLinecap="round"/>
                        <line x1="150" y1="200" x2="130" y2="180" stroke="#7a5c1e" strokeWidth="4" strokeLinecap="round"/>
                        <circle cx="150" cy="165" r="45" fill={leafColor.dark} opacity="0.8"/>
                        <circle cx="114" cy="182" r="28" fill={leafColor.mid} opacity="0.88"/>
                        <circle cx="186" cy="178" r="28" fill={leafColor.mid} opacity="0.88"/>
                        <circle cx="135" cy="152" r="24" fill={leafColor.light} opacity="0.9"/>
                        <circle cx="165" cy="150" r="24" fill={leafColor.light} opacity="0.9"/>
                        <circle cx="150" cy="142" r="26" fill={leafColor.light} opacity="0.85"/>
                    </g>
                )}

                {/* Stage 4 — full tree */}
                {stage === 4 && (
                    <g>
                        <rect x="141" y="175" width="18" height="62" rx="6" fill="#6b4f1a"/>
                        <line x1="150" y1="218" x2="100" y2="195" stroke="#6b4f1a" strokeWidth="8" strokeLinecap="round"/>
                        <line x1="150" y1="208" x2="200" y2="188" stroke="#6b4f1a" strokeWidth="7" strokeLinecap="round"/>
                        <line x1="150" y1="198" x2="118" y2="172" stroke="#6b4f1a" strokeWidth="5" strokeLinecap="round"/>
                        <line x1="150" y1="195" x2="182" y2="170" stroke="#6b4f1a" strokeWidth="5" strokeLinecap="round"/>
                        <circle cx="150" cy="155" r="55" fill={leafColor.dark} opacity="0.82"/>
                        <circle cx="102" cy="180" r="32" fill={leafColor.mid} opacity="0.88"/>
                        <circle cx="198" cy="174" r="32" fill={leafColor.mid} opacity="0.88"/>
                        <circle cx="128" cy="138" r="30" fill={leafColor.light} opacity="0.9"/>
                        <circle cx="172" cy="136" r="30" fill={leafColor.light} opacity="0.9"/>
                        <circle cx="150" cy="120" r="34" fill={leafColor.light} opacity="0.88"/>
                        <circle cx="120" cy="158" r="22" fill={leafColor.mid} opacity="0.7"/>
                        <circle cx="180" cy="155" r="22" fill={leafColor.mid} opacity="0.7"/>
                    </g>
                )}

                {/* Stage 5 — fruitful tree (100-200 words) */}
                {stage === 5 && (
                    <g>
                        <rect x="140" y="170" width="20" height="67" rx="7" fill="#5c4018"/>
                        <line x1="150" y1="220" x2="92" y2="192" stroke="#5c4018" strokeWidth="10" strokeLinecap="round"/>
                        <line x1="150" y1="208" x2="208" y2="183" stroke="#5c4018" strokeWidth="9" strokeLinecap="round"/>
                        <line x1="150" y1="196" x2="112" y2="165" stroke="#5c4018" strokeWidth="6" strokeLinecap="round"/>
                        <line x1="150" y1="192" x2="188" y2="163" stroke="#5c4018" strokeWidth="6" strokeLinecap="round"/>
                        <circle cx="150" cy="148" r="60" fill={leafColor.dark} opacity="0.85"/>
                        <circle cx="94" cy="176" r="35" fill={leafColor.mid} opacity="0.88"/>
                        <circle cx="206" cy="170" r="35" fill={leafColor.mid} opacity="0.88"/>
                        <circle cx="124" cy="128" r="34" fill={leafColor.light} opacity="0.9"/>
                        <circle cx="176" cy="126" r="34" fill={leafColor.light} opacity="0.9"/>
                        <circle cx="150" cy="110" r="38" fill={leafColor.light} opacity="0.88"/>
                        {/* Fruits! */}
                        {[{cx:132,cy:155},{cx:168,cy:152},{cx:148,cy:138},{cx:118,cy:168},{cx:182,cy:165},{cx:158,cy:170}].map((f,i)=>(
                            <g key={i}>
                                <circle cx={f.cx} cy={f.cy} r="6" fill="#e74c3c"/>
                                <line x1={f.cx} y1={f.cy-6} x2={f.cx+3} y2={f.cy-10} stroke="#2d7a35" strokeWidth="1.5" strokeLinecap="round"/>
                            </g>
                        ))}
                    </g>
                )}

                {/* Stage 6 — ancient tree (200-400) */}
                {stage === 6 && (
                    <g>
                        {/* Massive gnarled trunk */}
                        <path d="M138,237 Q132,210 136,185 Q140,160 142,140 L158,140 Q160,160 164,185 Q168,210 162,237 Z" fill="#4a3010"/>
                        {/* Roots */}
                        <path d="M142,232 Q128,238 115,242" stroke="#4a3010" strokeWidth="6" fill="none" strokeLinecap="round"/>
                        <path d="M158,232 Q172,238 185,242" stroke="#4a3010" strokeWidth="6" fill="none" strokeLinecap="round"/>
                        <path d="M145,235 Q140,245 132,248" stroke="#4a3010" strokeWidth="4" fill="none" strokeLinecap="round"/>
                        {/* Massive branches */}
                        <line x1="148" y1="215" x2="82" y2="182" stroke="#4a3010" strokeWidth="12" strokeLinecap="round"/>
                        <line x1="152" y1="205" x2="218" y2="175" stroke="#4a3010" strokeWidth="11" strokeLinecap="round"/>
                        <line x1="148" y1="192" x2="105" y2="155" stroke="#4a3010" strokeWidth="8" strokeLinecap="round"/>
                        <line x1="152" y1="188" x2="195" y2="152" stroke="#4a3010" strokeWidth="7" strokeLinecap="round"/>
                        {/* Giant canopy */}
                        <circle cx="150" cy="138" r="68" fill={leafColor.dark} opacity="0.82"/>
                        <circle cx="84" cy="170" r="40" fill={leafColor.mid} opacity="0.88"/>
                        <circle cx="216" cy="163" r="40" fill={leafColor.mid} opacity="0.88"/>
                        <circle cx="116" cy="112" r="40" fill={leafColor.light} opacity="0.9"/>
                        <circle cx="184" cy="110" r="40" fill={leafColor.light} opacity="0.9"/>
                        <circle cx="150" cy="92" r="44" fill={leafColor.light} opacity="0.88"/>
                        <circle cx="108" cy="148" r="28" fill={leafColor.mid} opacity="0.7"/>
                        <circle cx="192" cy="144" r="28" fill={leafColor.mid} opacity="0.7"/>
                        {/* Fruits */}
                        {[{cx:128,cy:145},{cx:172,cy:142},{cx:145,cy:125},{cx:108,cy:162},{cx:192,cy:158},{cx:162,cy:160},{cx:138,cy:165},{cx:155,cy:108}].map((f,i)=>(
                            <g key={i}>
                                <circle cx={f.cx} cy={f.cy} r="6" fill="#e74c3c"/>
                                <line x1={f.cx} y1={f.cy-6} x2={f.cx+3} y2={f.cy-10} stroke="#2d7a35" strokeWidth="1.5" strokeLinecap="round"/>
                            </g>
                        ))}
                    </g>
                )}

                {/* Stage 7 — grove (400-700) */}
                {stage === 7 && (
                    <g>
                        {/* Background trees */}
                        <g opacity="0.55">
                            <rect x="46" y="185" width="10" height="52" rx="4" fill="#4a3010"/>
                            <circle cx="51" cy="165" r="32" fill={leafColor.dark}/>
                            <circle cx="38" cy="175" r="20" fill={leafColor.mid}/>
                            <circle cx="64" cy="172" r="20" fill={leafColor.mid}/>
                        </g>
                        <g opacity="0.55">
                            <rect x="244" y="185" width="10" height="52" rx="4" fill="#4a3010"/>
                            <circle cx="249" cy="165" r="32" fill={leafColor.dark}/>
                            <circle cx="236" cy="175" r="20" fill={leafColor.mid}/>
                            <circle cx="262" cy="172" r="20" fill={leafColor.mid}/>
                        </g>
                        {/* Main ancient tree */}
                        <path d="M138,237 Q130,205 135,178 Q140,152 142,132 L158,132 Q160,152 165,178 Q170,205 162,237 Z" fill="#3d2808"/>
                        <path d="M142,230 Q125,238 108,244" stroke="#3d2808" strokeWidth="7" fill="none" strokeLinecap="round"/>
                        <path d="M158,230 Q175,238 192,244" stroke="#3d2808" strokeWidth="7" fill="none" strokeLinecap="round"/>
                        <line x1="148" y1="210" x2="76" y2="174" stroke="#3d2808" strokeWidth="13" strokeLinecap="round"/>
                        <line x1="152" y1="198" x2="224" y2="166" stroke="#3d2808" strokeWidth="12" strokeLinecap="round"/>
                        <line x1="148" y1="185" x2="98" y2="148" stroke="#3d2808" strokeWidth="9" strokeLinecap="round"/>
                        <line x1="152" y1="180" x2="202" y2="144" stroke="#3d2808" strokeWidth="8" strokeLinecap="round"/>
                        <circle cx="150" cy="128" r="75" fill={leafColor.dark} opacity="0.82"/>
                        <circle cx="78" cy="162" r="44" fill={leafColor.mid} opacity="0.88"/>
                        <circle cx="222" cy="155" r="44" fill={leafColor.mid} opacity="0.88"/>
                        <circle cx="112" cy="100" r="44" fill={leafColor.light} opacity="0.9"/>
                        <circle cx="188" cy="98" r="44" fill={leafColor.light} opacity="0.9"/>
                        <circle cx="150" cy="80" r="48" fill={leafColor.light} opacity="0.88"/>
                        {[{cx:122,cy:135},{cx:178,cy:132},{cx:148,cy:112},{cx:100,cy:155},{cx:200,cy:148},{cx:165,cy:152},{cx:135,cy:158},{cx:152,cy:96},{cx:130,cy:118},{cx:170,cy:116}].map((f,i)=>(
                            <g key={i}>
                                <circle cx={f.cx} cy={f.cy} r="6" fill="#e74c3c"/>
                                <line x1={f.cx} y1={f.cy-6} x2={f.cx+3} y2={f.cy-10} stroke="#2d7a35" strokeWidth="1.5" strokeLinecap="round"/>
                            </g>
                        ))}
                    </g>
                )}

                {/* Stage 8 — magical forest (700+) */}
                {stage === 8 && (
                    <g>
                        {/* Glow */}
                        <circle cx="150" cy="130" r="90" fill="url(#glowGrad)"/>
                        {/* Far background trees */}
                        {[{x:20,s:0.4},{x:265,s:0.38},{x:8,s:0.3},{x:278,s:0.32}].map((t,i)=>(
                            <g key={i} opacity={t.s+0.1} transform={`translate(${t.x}, 10) scale(${t.s})`}>
                                <rect x="45" y="175" width="12" height="65" rx="5" fill="#3d2808"/>
                                <circle cx="51" cy="148" r="42" fill={leafColor.dark}/>
                                <circle cx="32" cy="162" r="26" fill={leafColor.mid}/>
                                <circle cx="70" cy="160" r="26" fill={leafColor.mid}/>
                                <circle cx="51" cy="120" r="30" fill={leafColor.light}/>
                            </g>
                        ))}
                        {/* Mid trees */}
                        {[{x:28,s:0.62,op:0.72},{x:218,s:0.62,op:0.72}].map((t,i)=>(
                            <g key={i} opacity={t.op}>
                                <rect x={t.x+4} y="192" width="11" height="48" rx="4" fill="#4a3010"/>
                                <circle cx={t.x+9} cy="172" r="36" fill={leafColor.dark}/>
                                <circle cx={t.x-6} cy="182" r="22" fill={leafColor.mid}/>
                                <circle cx={t.x+24} cy="180" r="22" fill={leafColor.mid}/>
                                <circle cx={t.x+9} cy="148" r="26" fill={leafColor.light}/>
                            </g>
                        ))}
                        {/* Main ancient tree */}
                        <path d="M136,238 Q126,202 132,172 Q138,145 140,125 L160,125 Q162,145 168,172 Q174,202 164,238 Z" fill="#2e1f06"/>
                        <path d="M140,228 Q120,238 100,246" stroke="#2e1f06" strokeWidth="8" fill="none" strokeLinecap="round"/>
                        <path d="M160,228 Q180,238 200,246" stroke="#2e1f06" strokeWidth="8" fill="none" strokeLinecap="round"/>
                        <line x1="146" y1="205" x2="64" y2="165" stroke="#2e1f06" strokeWidth="15" strokeLinecap="round"/>
                        <line x1="154" y1="192" x2="236" y2="155" stroke="#2e1f06" strokeWidth="14" strokeLinecap="round"/>
                        <line x1="146" y1="178" x2="88" y2="138" stroke="#2e1f06" strokeWidth="10" strokeLinecap="round"/>
                        <line x1="154" y1="172" x2="212" y2="134" stroke="#2e1f06" strokeWidth="9" strokeLinecap="round"/>
                        <circle cx="150" cy="118" r="80" fill={leafColor.dark} opacity="0.85"/>
                        <circle cx="68" cy="153" r="48" fill={leafColor.mid} opacity="0.88"/>
                        <circle cx="232" cy="146" r="48" fill={leafColor.mid} opacity="0.88"/>
                        <circle cx="106" cy="86" r="48" fill={leafColor.light} opacity="0.9"/>
                        <circle cx="194" cy="84" r="48" fill={leafColor.light} opacity="0.9"/>
                        <circle cx="150" cy="64" r="52" fill={leafColor.light} opacity="0.9"/>
                        {/* Stars/sparkles for magical effect */}
                        {[{x:82,y:72},{x:218,y:68},{x:56,y:118},{x:244,y:112},{x:150,y:48},{x:108,y:56},{x:192,y:54}].map((s,i)=>(
                            <g key={i}>
                                <circle cx={s.x} cy={s.y} r="2.5" fill="#FFD93D" opacity="0.9"/>
                                <line x1={s.x-5} y1={s.y} x2={s.x+5} y2={s.y} stroke="#FFD93D" strokeWidth="1" opacity="0.7"/>
                                <line x1={s.x} y1={s.y-5} x2={s.x} y2={s.y+5} stroke="#FFD93D" strokeWidth="1" opacity="0.7"/>
                            </g>
                        ))}
                        {/* Many fruits */}
                        {[{cx:118,cy:128},{cx:182,cy:125},{cx:148,cy:105},{cx:92,cy:148},{cx:208,cy:140},{cx:165,cy:145},{cx:135,cy:152},{cx:152,cy:88},{cx:125,cy:110},{cx:175,cy:108},{cx:104,cy:132},{cx:196,cy:126}].map((f,i)=>(
                            <g key={i}>
                                <circle cx={f.cx} cy={f.cy} r="6" fill="#e74c3c"/>
                                <line x1={f.cx} y1={f.cy-6} x2={f.cx+3} y2={f.cy-10} stroke="#2d7a35" strokeWidth="1.5" strokeLinecap="round"/>
                            </g>
                        ))}
                    </g>
                )}

            </svg>

            {/* Label below tree */}
            <div className="vocab-tree-label">
                <span className="tree-stage-name">{info.emoji} {info.label}</span>
                <span className="tree-stage-desc">{info.desc}</span>
                {totalWords > 0 && (
                    <div className="tree-progress">
                        <div className="tree-progress-bar">
                            <div
                                className="tree-progress-fill"
                                style={{ width: `${Math.min(learnedRatio * 100, 100)}%` }}
                            />
                        </div>
                        <span className="tree-progress-label">
                            {learnedWords} learned · {totalWords - learnedWords} to review
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default VocabTree;
