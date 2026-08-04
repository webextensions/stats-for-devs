import {
    line as lineClass,
    Sparkline as styles_Sparkline
} from './Sparkline.module.css';

// Minimal inline trend graph for a numeric metric's rolling history. Renders nothing until there are at
// least two samples. Used by the overlay alongside numeric metric values.
const Sparkline = function ({
    height = 16,
    values,
    width = 60
}: {
    height?: number;
    values: number[];
    width?: number
}) {
    if (!values || values.length < 2) {
        return null;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const stepX = width / (values.length - 1);

    const points = values
        .map((value, index) => {
            const x = index * stepX;
            const y = height - (((value - min) / range) * height);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');

    return (
        <svg
            className={styles_Sparkline}
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
        >
            <polyline className={lineClass} points={points} fill="none" />
        </svg>
    );
};

export { Sparkline };
