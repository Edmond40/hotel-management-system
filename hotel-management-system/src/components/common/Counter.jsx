import { useEffect, useRef, useState } from 'react';

function Counter({ value, duration = 900, suffix = '', prefix = '' }) {
	const [display, setDisplay] = useState(0);
	const startTsRef = useRef(null);
	const rafRef = useRef(null);

	useEffect(() => {
		const target = Number(value) || 0;
		startTsRef.current = null;
		cancelAnimationFrame(rafRef.current);

		const step = (ts) => {
			if (!startTsRef.current) startTsRef.current = ts;
			const progress = Math.min(1, (ts - startTsRef.current) / duration);
			setDisplay(Math.round(progress * target));
			if (progress < 1) rafRef.current = requestAnimationFrame(step);
		};

		rafRef.current = requestAnimationFrame(step);
		return () => cancelAnimationFrame(rafRef.current);
	}, [value, duration]);

	return <span>{prefix}{display}{suffix}</span>;
}

export default Counter;


