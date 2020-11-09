export const dragBarThickness = 5;

export enum LayoutItemDirection {
	Row = 'row',
	Column = 'column',
}

export interface Size {
	width: number,
	height: number,
}

export interface LayoutItem {
	key: string,
	width?: number,
	height?: number,
	minWidth?: number,
	minHeight?: number,
	children?: LayoutItem[]
	direction?: LayoutItemDirection,
	resizableRight?: boolean,
	resizableBottom?: boolean,
	visible?: boolean,
	context?: any,
}
