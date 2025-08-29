function ChartCard({ title, value, subtitle, children }) {
	return (
		<div className="bg-white rounded-lg shadow-md border border-slate-200 p-4 flex flex-col gap-3 transition-transform duration-200 hover:shadow-lg hover:-translate-y-0.5" data-aos="fade-up">
			<div className="flex items-baseline justify-between">
				<h3 className="text-sm font-medium text-slate-600">{title}</h3>
				{value && <div className="text-lg font-semibold text-slate-800">{value}</div>}
			</div>
			<div className="h-32">{children}</div>
			{subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
		</div>
	);
}

export default ChartCard;


