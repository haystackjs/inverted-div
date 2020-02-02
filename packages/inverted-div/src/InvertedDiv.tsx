import * as React from 'react';
import { ResizeObserver as ResizeObserverPolyfill } from '@juggle/resize-observer';
import { throttle } from './utils/throttle';

const canUseDOM = !!(typeof window !== 'undefined' &&
    window.document &&
    window.document.createElement);
const ResizeObserver = ((canUseDOM && ((window as any).ResizeObserver)) || ResizeObserverPolyfill) as typeof ResizeObserverPolyfill;

export interface InvertedDivScrollValues {
    scrollHeight: number;
    scrollTop: number;
    clientHeight: number;
}

export interface InvertedDivInstance {
    scrollToBottom: () => void;
    getScrollTop: () => number;
    getClientHeight: () => number;
}

export interface InvertedDivProps {
    onScroll?: (values: InvertedDivScrollValues) => void;
    children?: any;
}

export const InvertedDiv = React.memo(React.forwardRef<InvertedDivInstance, InvertedDivProps>((props, ref) => {
    const outerRef = React.useRef<HTMLDivElement>(null);
    const innerRef = React.useRef<HTMLDivElement>(null);
    const outerHeight = React.useRef<number>(0);
    const innerHeight = React.useRef<number>(0);
    const scrollTop = React.useRef<number>(0);

    // Instance methods
    React.useImperativeHandle<InvertedDivInstance, InvertedDivInstance>(ref, () => ({
        scrollToBottom: () => {
            if (outerRef.current) {
                outerRef.current.scrollTop = innerHeight.current;
            }
        },
        getScrollTop: () => {
            return scrollTop.current;
        },
        getClientHeight: () => {
            return outerHeight.current;
        }
    }));

    // onScroll reporter
    const reportOnScroll = React.useMemo(() => {
        let reportedClientHeight: number = 0;
        let reportedScrollTop: number = 0;
        let reportedScrollHeight: number = 0;

        return throttle(() => {
            const scrollHeight = innerHeight.current;
            const clientHeight = outerHeight.current;
            if (
                reportedScrollTop !== scrollTop.current ||
                reportedScrollHeight !== scrollHeight ||
                reportedClientHeight !== clientHeight
            ) {
                reportedScrollHeight = scrollHeight;
                reportedScrollTop = scrollTop.current;
                reportedClientHeight = clientHeight;
                if (props.onScroll) {
                    props.onScroll({
                        scrollHeight,
                        scrollTop: scrollTop.current,
                        clientHeight,
                    });
                }
            }
        }, 150);
    }, []);

    // Initial calculations
    React.useLayoutEffect(() => {
        const outerDiv = outerRef.current!!;
        const innerDiv = innerRef.current!!;
        innerHeight.current = innerDiv.clientHeight;
        outerHeight.current = outerDiv.clientHeight;
        scrollTop.current = innerHeight.current;
        outerDiv.scrollTop = scrollTop.current;
        reportOnScroll();

        // Watch for scroll
        const onScrollHandler = () => {
            scrollTop.current = outerDiv.scrollTop;
            reportOnScroll();
        };
        outerDiv.addEventListener('scroll', onScrollHandler, { passive: true });

        // Watch for size
        const childSizes = new Map<HTMLDivElement, number>();
        const childOffsets = new Map<HTMLDivElement, number>();
        let observer = new ResizeObserver(src => {
            let outer = outerHeight.current;
            let inner = innerHeight.current;

            let delta = 0;
            let topWindow = outerDiv.scrollTop;
            let bottomWindow = topWindow + outerDiv.clientHeight;

            for (let s of src) {
                if (s.contentRect.height === 0 && s.contentRect.width === 0) {
                    continue;
                }
                if (s.target === innerDiv) {
                    // If inner div size changed
                    inner = s.contentRect.height;
                } else if (s.target === outerDiv) {
                    // If outer div size changed
                    outer = s.contentRect.height;
                } else {
                    // If direct child size changed
                    let t = s.target as HTMLDivElement;
                    let ex = childSizes.get(t);
                    if (ex !== undefined) {
                        // Measure height delta
                        let d = s.contentRect.height - ex;

                        // Update child dimensions
                        childSizes.set(t, s.contentRect.height);
                        // childOffsets.set(t, s.contentRect.top);

                        // If changed height - adjust scrolling offset
                        if (d !== 0) {
                            let top = t.offsetTop;
                            let bottom = top + t.clientHeight;

                            // If changed above of the bottom of the view window
                            // then adjust scrolling position
                            if (top <= bottomWindow || bottom <= bottomWindow) {
                                delta += d;
                            }
                        }
                    }
                }
            }

            // Outer Container Delta
            if (outer !== outerHeight.current) {
                delta += outerHeight.current - outer;
            }

            // Apply
            scrollTop.current = scrollTop.current + delta;
            outerDiv.scrollTop = scrollTop.current;

            // Save Values
            outerHeight.current = outer;
            innerHeight.current = inner;
            reportOnScroll();
        });
        observer.observe(innerDiv);
        observer.observe(outerDiv);

        // Watch for children changes
        for (let i = 0; i < innerRef.current!.childElementCount; i++) {
            let node = innerRef.current!.childNodes[i] as HTMLDivElement;
            childSizes.set(node, node.clientHeight);
            childOffsets.set(node, node.offsetTop);
            observer.observe(node);
        }
        let childObserver = new MutationObserver((mutations) => {
            let delta = 0;
            let topWindow = outerDiv.scrollTop;
            let bottomWindow = topWindow + outerDiv.clientHeight;

            for (let m of mutations) {
                if (m.type === 'childList') {

                    // Removed nodes
                    for (let ri = 0; ri < m.removedNodes.length; ri++) {
                        let r = m.removedNodes[ri] as HTMLDivElement;

                        let top = childOffsets.get(r)!;
                        let bottom = top + childSizes.get(r)!;

                        // Adjust delta if element was removed from above 
                        // of the bottom of viewport
                        if (top <= bottomWindow || bottom <= bottomWindow) {
                            delta -= childSizes.get(r)!;
                        }

                        observer.unobserve(r);
                        childSizes.delete(r);
                        childOffsets.delete(r);
                    }

                    // Added nodes
                    for (let ri = 0; ri < m.addedNodes.length; ri++) {
                        let r = m.addedNodes[ri] as HTMLDivElement;

                        // Update offset
                        let top = r.offsetTop;
                        let bottom = top + r.clientHeight;

                        // Adjust delta if element was added above 
                        // of the bottom of viewport
                        if (top <= bottomWindow || bottom <= bottomWindow) {
                            delta += r.clientHeight;
                        }

                        // Set initial values
                        childSizes.set(r, r.clientHeight);
                        childOffsets.set(r, r.offsetTop);
                        observer.observe(r);
                    }
                }
            }

            // Apply changes
            scrollTop.current = scrollTop.current + delta;
            outerDiv.scrollTop = scrollTop.current;
        });
        childObserver.observe(innerDiv, { childList: true });

        return () => {
            outerDiv.removeEventListener('scroll', onScrollHandler);
            observer.disconnect();
            childObserver.disconnect();
        };
    }, []);

    return (
        <div className={'haystack-inverted-div'} ref={outerRef}>
            <div className={'haystack-inverted-div-content'} ref={innerRef}>
                {props.children}
            </div>
        </div>
    );
}));