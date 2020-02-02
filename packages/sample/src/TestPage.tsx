import * as React from 'react';
import { XView } from 'react-mental';
import { InvertedDiv } from 'inverted-div';

export const TestPage = React.memo(() => {

    const [topCount, setTopCount] = React.useState(5);
    const [bottomCount, setBottomCount] = React.useState(5);
    const [zeroHeight, setZeroHeight] = React.useState(100);

    let items: any[] = [];
    for (let i = -topCount; i < bottomCount; i++) {
        items.push(
            <XView
                key={'item-' + i}
                height={i === 0 ? zeroHeight : 100}
                backgroundColor={i % 2 === 0 ? '#7986CB' : '#3949AB'}
                color="white"
                alignItems="center"
                justifyContent="center"
            >
                {i.toString()}
            </XView>
        );
    }

    return (
        <XView flexDirection="column" alignItems="center" height="100%">
            <XView flexDirection="row" justifyContent="center" alignSelf="stretch" flexGrow={1} flexShrink={1} flexBasis={0} minHeight={0}>
                <XView
                    maxWidth={600}
                    flexGrow={1}
                    flexShrink={1}
                    flexBasis={0}
                    flexDirection="column"
                    minHeight={0}
                >
                    <XView flexDirection="column" backgroundColor="#0F4C81">
                        <XView
                            flexDirection="row"
                            height={48}
                            fontSize={20}
                            alignSelf="center"
                            alignItems="center"
                            color="white"
                        >
                            <span>Inverted Div</span>
                        </XView>
                    </XView>

                    <XView flexDirection="row" backgroundColor="#9E9E9E" height={48} alignItems="center" justifyContent="center">
                        <button onClick={() => setZeroHeight(Math.ceil(Math.random() * 200) + 20)}>Randomize Zero Height</button>
                        <button onClick={() => setTopCount((s) => s + 1)}>Add Top</button>
                        <button onClick={() => setTopCount((s) => s - 1)}>Remove Top</button>
                        <button onClick={() => setBottomCount((s) => s + 1)}>Add Bottom</button>
                        <button onClick={() => setBottomCount((s) => s - 1)}>Remove Bottom</button>
                    </XView>

                    <XView flexDirection="column" backgroundColor="#E0E0E0" flexGrow={1} flexShrink={1} flexBasis={0} minHeight={0}>
                        <InvertedDiv>
                            {items}
                        </InvertedDiv>
                    </XView>
                </XView>
            </XView>
        </XView>
    )
});