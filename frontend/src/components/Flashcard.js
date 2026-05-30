// import { useEffect, useState } from "react";
// import api from "../api";

// function Flashcards() {

//     const [words, setWords] = useState([]);
//     const [index, setIndex] = useState(0);
//     const [flip, setFlip] = useState(false);

//     useEffect(() => {
//         fetchWords();
//     }, []);

//     const fetchWords = async () => {
//         const res = await api.get("/words");
//         setWords(res.data);
//     };

//     if (words.length === 0) {
//         return <h2 style={{ padding: "20px" }}>No words yet</h2>;
//     }

//     const word = words[index];

//     const nextCard = () => {
//         setFlip(false);
//         setIndex((prev) => (prev + 1) % words.length);
//     };

//     return (

//         <div style={{
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//             marginTop: "50px"
//         }}>

//             <h2>Flashcards</h2>

//             {/* CARD */}
//             <div
//                 onClick={() => setFlip(!flip)}
//                 style={{
//                     width: "300px",
//                     height: "200px",
//                     border: "2px solid black",
//                     borderRadius: "10px",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     cursor: "pointer",
//                     marginTop: "20px"
//                 }}
//             >

//                 {!flip ? (

//                     <h1>{word.word}</h1>

//                 ) : (

//                     <div style={{ textAlign: "center" }}>
//                         <p>{word.meaning}</p>
//                         <p style={{ color: "gray" }}>
//                             {word.synonyms?.join(", ")}
//                         </p>
//                     </div>

//                 )}

//             </div>

//             <button
//                 onClick={nextCard}
//                 style={{
//                     marginTop: "20px",
//                     padding: "10px"
//                 }}
//             >
//                 Next
//             </button>

//         </div>
//     );
// }

// export default Flashcards;