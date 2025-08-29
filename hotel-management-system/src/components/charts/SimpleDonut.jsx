function SimpleDonut({ value = 0.7, color = '#f59e0b' }) {
	const size = 120;
	const stroke = 12;
	const r = (size - stroke) / 2;
	const c = 2 * Math.PI * r;
	const offset = c * (1 - Math.max(0, Math.min(1, value)));

	return (
		<svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
			<circle cx={size/2} cy={size/2} r={r} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
			<circle
				cx={size/2}
				cy={size/2}
				r={r}
				stroke={color}
				strokeWidth={stroke}
				fill="none"
				strokeDasharray={c}
				strokeDashoffset={offset}
				strokeLinecap="round"
				transform={`rotate(-90 ${size/2} ${size/2})`}
				className="transition-all duration-700"
			/>
		</svg>
	);
}

export default SimpleDonut;


