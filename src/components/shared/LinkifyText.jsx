const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

export default function LinkifyText({ children }) {
  if (typeof children !== 'string') return children;

  const parts = children.split(URL_REGEX);

  return parts.map((part, i) =>
    URL_REGEX.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 dark:text-indigo-400 underline break-all"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}
