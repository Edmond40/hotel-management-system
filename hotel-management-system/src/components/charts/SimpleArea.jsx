import { useMemo, useRef, useState } from 'react';

function SimpleArea({ data = [], color = '#16a34a' }) {
	const width = 400;
	const height = 120;
	const padding = 8;
	const maxY = Math.max(1, ...data);

	const xPositions = useMemo(() => {
		const denom = Math.max(1, data.length - 1);
		return data.map((_, i) => padding + (i * (width - padding * 2)) / denom);
	}, [data]);

	const yPositions = useMemo(() => data.map((y) => height - padding - (y / maxY) * (height - padding * 2)), [data, maxY]);

	const points = useMemo(() => xPositions.map((x, i) => `${x},${yPositions[i]}`).join(' '), [xPositions, yPositions]);

	const [hoverIndex, setHoverIndex] = useState(null);
	const svgRef = useRef(null);

	const handleMove = (e) => {
		if (!svgRef.current) return;
		const rect = svgRef.current.getBoundingClientRect();
		const x = e.clientX - rect.left;
		let nearest = 0;
		let minDist = Infinity;
		xPositions.forEach((xp, i) => {
			const d = Math.abs(xp - x);
			if (d < minDist) { minDist = d; nearest = i; }
		});
		setHoverIndex(nearest);
	};

	return (
		<svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
			<polyline
				fill={`${color}22`}
				stroke="none"
				points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
			/>
			<polyline
				fill="none"
				stroke={color}
				strokeWidth="2"
				className="transition-[stroke-width] duration-500"
				points={points}
			/>

			{hoverIndex !== null && (
				<g>
					<line x1={xPositions[hoverIndex]} y1={padding} x2={xPositions[hoverIndex]} y2={height - padding} stroke={`${color}66`} strokeDasharray="4 4" />
					<circle cx={xPositions[hoverIndex]} cy={yPositions[hoverIndex]} r="5" fill={color} stroke="#ffffff" strokeWidth="2" />
					<text x={xPositions[hoverIndex]} y={yPositions[hoverIndex] - 8} textAnchor="middle" fontSize="10" fill="#475569">{data[hoverIndex]}</text>
				</g>
			)}

			<rect x="0" y="0" width={width} height={height} fill="transparent" onMouseMove={handleMove} onMouseLeave={() => setHoverIndex(null)} />
		</svg>
	);
}

export default SimpleArea;


