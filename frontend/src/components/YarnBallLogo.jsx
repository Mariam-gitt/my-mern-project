export default function YarnBallLogo({ size = 28 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            className="yarn-ball-logo"
        >
            <circle cx="16" cy="16" r="13" fill="#2a2a2a" />
            <ellipse cx="16" cy="16" rx="13" ry="5" stroke="#4a4a4a" strokeWidth="1.2" fill="none" />
            <ellipse cx="16" cy="16" rx="10" ry="8" stroke="#5c5c5c" strokeWidth="1" fill="none" transform="rotate(35 16 16)" />
            <ellipse cx="16" cy="16" rx="8" ry="11" stroke="#6e6e6e" strokeWidth="0.9" fill="none" transform="rotate(-25 16 16)" />
            <ellipse cx="16" cy="16" rx="12" ry="4" stroke="#3d3d3d" strokeWidth="1.1" fill="none" transform="rotate(70 16 16)" />
            <circle cx="16" cy="16" r="2.5" fill="#1a1a1a" />
        </svg>
    );
}
