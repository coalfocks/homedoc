import { Component, createElement } from "../../../../../../esm.sh/react@17.0.2.js";
export class ErrorBoundary extends Component {
    constructor(props){
        super(props);
        this.state = {
            error: null
        };
    }
    static getDerivedStateFromError(e) {
        return {
            error: e
        };
    }
    componentDidCatch(e) {
        console.error(e);
    }
    render() {
        const { error  } = this.state;
        if (error) {
            return createElement('pre', null, error.stack || error.message || error.toString());
        }
        return this.props.children;
    }
}
export function E404Page() {
    return createElement(StatusError, {
        status: 404,
        message: 'Page Not Found'
    });
}
export function E400MissingComponent({ name  }) {
    return createElement(StatusError, {
        status: 400,
        message: `Module "${name}" should export a React Component as default`,
        showRefreshButton: true
    });
}
const resetStyle = {
    padding: 0,
    margin: 0,
    lineHeight: 1.5,
    fontSize: 15,
    fontWeight: 400,
    color: '#333'
};
export function StatusError({ status , message  }) {
    return createElement('div', {
        style: {
            ...resetStyle,
            position: 'fixed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            width: '100vw',
            height: '100vh'
        }
    }, createElement('p', {
        style: {
            ...resetStyle,
            fontWeight: 500
        }
    }, createElement('code', {
        style: {
            ...resetStyle,
            fontWeight: 700
        }
    }, status), createElement('small', {
        style: {
            ...resetStyle,
            fontSize: 14,
            color: '#999'
        }
    }, ' - '), createElement('span', null, message)));
}

//# sourceMappingURL=ErrorBoundary.js.map