// Styles
import 'normalize.css/normalize.css';
import './index.css';
import 'inverted-div/InvertedDiv.css';
import { XStyleFactoryRegistry } from 'react-mental';
import { css } from 'glamor';
XStyleFactoryRegistry.registerFactory({
    createStyle: styles => {
        return css(styles).toString();
    },
});
css.global('html', {
    fontFamily: '"-apple-system",BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"'
});

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { TestPage } from './TestPage';

// App

ReactDOM.render(
    <TestPage />,
    document.getElementById('root'),
);