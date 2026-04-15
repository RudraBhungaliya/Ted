type Props = {
    children : React.ReactNode,
    onClick : () => void,
    className?:string,
}

export default function Button({ children, onClick, className = "" }: Props) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 transition text-sm ${className}`}
    >
      {children}
    </button>
  );
}