function SimpleBar({ data = [], color = '#0ea5e9' }) {
	const width = 400;
	const height = 120;
	const padding = 8;
	const maxY = Math.max(1, ...data);
	const barWidth = (width - padding * 2) / (data.length || 1);

	return (
		<svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
			{data.map((y, i) => {
				const h = ((y / maxY) * (height - padding * 2));
				const x = padding + i * barWidth + barWidth * 0.1;
				const w = barWidth * 0.8;
				const yPos = height - padding - h;
				return <rect key={i} x={x} y={yPos} width={w} height={h} fill={color} rx="3" className="transition-transform duration-200 hover:-translate-y-0.5" />
			})}
		</svg>
	);
}

export default SimpleBar;


