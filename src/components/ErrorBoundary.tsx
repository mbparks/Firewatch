import React from 'react';
export default class ErrorBoundary extends React.Component<React.PropsWithChildren,{error?:Error}>{
 state:{error?:Error}={};
 static getDerivedStateFromError(error:Error){return{error}}
 componentDidCatch(error:Error,info:React.ErrorInfo){console.error('FIREWATCH UI failure',error,info)}
 render(){if(this.state.error)return <div className="fatal-screen"><span className="section-kicker">FIREWATCH RECOVERY</span><h1>Interface recovery mode</h1><p>The local database has not been intentionally cleared. Reload the application first; if the problem continues, export the browser site data before resetting the station.</p><pre>{this.state.error.message}</pre><button className="btn primary" onClick={()=>location.reload()}>Reload FIREWATCH</button></div>;return this.props.children}
}
