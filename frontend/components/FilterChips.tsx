type Option = { value: string; label: string };
type Props = { options: Option[]; value: string; onChange: (value: string) => void };

export default function FilterChips({ options, value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`rounded-full px-3 py-1.5 text-sm transition ${
            value === o.value ? "bg-indigo-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
