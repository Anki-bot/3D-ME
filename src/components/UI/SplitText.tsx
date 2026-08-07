interface SplitTextProps {
  text: string;
  className?: string;
}

export default function SplitText({
  text,
  className = "",
}: SplitTextProps) {
  const words = text.split(" ");

  return (
    <>
      {words.map((word, index) => (
        <span
          key={index}
          className={`split-word inline-block ${className}`}
        >
          {word}
          {index < words.length - 1 && "\u00A0"}
        </span>
      ))}
    </>
  );
}