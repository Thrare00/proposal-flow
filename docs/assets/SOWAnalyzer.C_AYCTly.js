import{a as q,j as s}from"./main.CTSSU6iE.js";import{r as w}from"./react-vendor.FM_WL_Bb.js";import{aj as V}from"./ui-lib.aMm-LhTE.js";let _={data:""},L=e=>{if(typeof window=="object"){let r=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return r.nonce=window.__nonce__,r.parentNode||(e||document.head).appendChild(r),r.firstChild}return e||_},M=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,K=/\/\*[^]*?\*\/|  +/g,k=/\n+/g,h=(e,r)=>{let l="",i="",t="";for(let o in e){let a=e[o];o[0]=="@"?o[1]=="i"?l=o+" "+a+";":i+=o[1]=="f"?h(a,o):o+"{"+h(a,o[1]=="k"?"":r)+"}":typeof a=="object"?i+=h(a,r?r.replace(/([^,])+/g,m=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,p=>/&/.test(p)?p.replace(/&/g,m):m?m+" "+p:p)):o):a!=null&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),t+=h.p?h.p(o,a):o+":"+a+";")}return l+(r&&t?r+"{"+t+"}":t)+i},b={},C=e=>{if(typeof e=="object"){let r="";for(let l in e)r+=l+C(e[l]);return r}return e},H=(e,r,l,i,t)=>{let o=C(e),a=b[o]||(b[o]=(p=>{let u=0,f=11;for(;u<p.length;)f=101*f+p.charCodeAt(u++)>>>0;return"go"+f})(o));if(!b[a]){let p=o!==e?e:(u=>{let f,g,y=[{}];for(;f=M.exec(u.replace(K,""));)f[4]?y.shift():f[3]?(g=f[3].replace(k," ").trim(),y.unshift(y[0][g]=y[0][g]||{})):y[0][f[1]]=f[2].replace(k," ").trim();return y[0]})(e);b[a]=h(t?{["@keyframes "+a]:p}:p,l?"":"."+a)}let m=l&&b.g?b.g:null;return l&&(b.g=b[a]),((p,u,f,g)=>{g?u.data=u.data.replace(g,p):u.data.indexOf(p)===-1&&(u.data=f?p+u.data:u.data+p)})(b[a],r,i,m),a},Z=(e,r,l)=>e.reduce((i,t,o)=>{let a=r[o];if(a&&a.call){let m=a(l),p=m&&m.props&&m.props.className||/^go/.test(m)&&m;a=p?"."+p:m&&typeof m=="object"?m.props?"":h(m,""):m===!1?"":m}return i+t+(a??"")},"");function E(e){let r=this||{},l=e.call?e(r.p):e;return H(l.unshift?l.raw?Z(l,[].slice.call(arguments,1),r.p):l.reduce((i,t)=>Object.assign(i,t&&t.call?t(r.p):t),{}):l,L(r.target),r.g,r.o,r.k)}let T,z,D;E.bind({g:1});let x=E.bind({k:1});function Q(e,r,l,i){h.p=r,T=e,z=l,D=i}function j(e,r){let l=this||{};return function(){let i=arguments;function t(o,a){let m=Object.assign({},o),p=m.className||t.className;l.p=Object.assign({theme:z&&z()},m),l.o=/ *go\d+/.test(p),m.className=E.apply(l,i)+(p?" "+p:"");let u=e;return e[0]&&(u=m.as||e,delete m.as),D&&u[0]&&D(m),T(u,m)}return t}}var Y=e=>typeof e=="function",W=(e,r)=>Y(e)?e(r):e,B=(()=>{let e=0;return()=>(++e).toString()})(),G=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let r=matchMedia("(prefers-reduced-motion: reduce)");e=!r||r.matches}return e}})(),J=20,P="default",R=(e,r)=>{let{toastLimit:l}=e.settings;switch(r.type){case 0:return{...e,toasts:[r.toast,...e.toasts].slice(0,l)};case 1:return{...e,toasts:e.toasts.map(a=>a.id===r.toast.id?{...a,...r.toast}:a)};case 2:let{toast:i}=r;return R(e,{type:e.toasts.find(a=>a.id===i.id)?1:0,toast:i});case 3:let{toastId:t}=r;return{...e,toasts:e.toasts.map(a=>a.id===t||t===void 0?{...a,dismissed:!0,visible:!1}:a)};case 4:return r.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(a=>a.id!==r.toastId)};case 5:return{...e,pausedAt:r.time};case 6:let o=r.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(a=>({...a,pauseDuration:a.pauseDuration+o}))}}},X=[],ee={toasts:[],pausedAt:void 0,settings:{toastLimit:J}},S={},$=(e,r=P)=>{S[r]=R(S[r]||ee,e),X.forEach(([l,i])=>{l===r&&i(S[r])})},F=e=>Object.keys(S).forEach(r=>$(e,r)),se=e=>Object.keys(S).find(r=>S[r].toasts.some(l=>l.id===e)),U=(e=P)=>r=>{$(r,e)},re=(e,r="blank",l)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:r,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...l,id:(l==null?void 0:l.id)||B()}),O=e=>(r,l)=>{let i=re(r,e,l);return U(i.toasterId||se(i.id))({type:2,toast:i}),i.id},d=(e,r)=>O("blank")(e,r);d.error=O("error");d.success=O("success");d.loading=O("loading");d.custom=O("custom");d.dismiss=(e,r)=>{let l={type:3,toastId:e};r?U(r)(l):F(l)};d.dismissAll=e=>d.dismiss(void 0,e);d.remove=(e,r)=>{let l={type:4,toastId:e};r?U(r)(l):F(l)};d.removeAll=e=>d.remove(void 0,e);d.promise=(e,r,l)=>{let i=d.loading(r.loading,{...l,...l==null?void 0:l.loading});return typeof e=="function"&&(e=e()),e.then(t=>{let o=r.success?W(r.success,t):void 0;return o?d.success(o,{id:i,...l,...l==null?void 0:l.success}):d.dismiss(i),t}).catch(t=>{let o=r.error?W(r.error,t):void 0;o?d.error(o,{id:i,...l,...l==null?void 0:l.error}):d.dismiss(i)}),e};var le=x`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,oe=x`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ae=x`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,ie=j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${le} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${oe} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${ae} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,ne=x`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,te=j("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${ne} 1s linear infinite;
`,ce=x`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,me=x`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,pe=j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${ce} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${me} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,de=j("div")`
  position: absolute;
`,ue=j("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,fe=x`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,we=j("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${fe} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,Ne=({toast:e})=>{let{icon:r,type:l,iconTheme:i}=e;return r!==void 0?typeof r=="string"?w.createElement(we,null,r):r:l==="blank"?null:w.createElement(ue,null,w.createElement(te,{...i}),l!=="loading"&&w.createElement(de,null,l==="error"?w.createElement(ie,{...i}):w.createElement(pe,{...i})))},be=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,xe=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,ge="0%{opacity:0;} 100%{opacity:1;}",ye="0%{opacity:1;} 100%{opacity:0;}",he=j("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,je=j("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,ve=(e,r)=>{let l=e.includes("top")?1:-1,[i,t]=G()?[ge,ye]:[be(l),xe(l)];return{animation:r?`${x(i)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${x(t)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};w.memo(({toast:e,position:r,style:l,children:i})=>{let t=e.height?ve(e.position||r||"top-center",e.visible):{opacity:0},o=w.createElement(Ne,{toast:e}),a=w.createElement(je,{...e.ariaProps},W(e.message,e));return w.createElement(he,{className:e.className,style:{...t,...l,...e.style}},typeof i=="function"?i({icon:o,message:a}):w.createElement(w.Fragment,null,o,a))});Q(w.createElement);E`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;const Se={scopeOfWork:{summary:"Overview",details:"This is a sample overview text",complianceStatus:"compliant",notes:"These are sample notes"},technicalRequirements:{summary:"Technical Requirements",details:"These are sample technical requirements",complianceStatus:"compliant",notes:"These are sample technical notes"},contractRequirements:{typeOfContract:["Fixed Price"],optionPeriods:["1 year"],periodOfPerformance:["12 months"],placeOfPerformance:["Client Site"]},keyTerms:{must:[{term:"Must Term",context:"This term must be met",section:"Technical Requirements"}],shall:[{term:"Shall Term",context:"This term shall be followed",section:"Contract Requirements"}],will:[{term:"Will Term",context:"This term will be implemented",section:"Scope of Work"}],otherCritical:[{term:"Critical Term",context:"This is a critical term",section:"Compliance"}]},performanceWorkStatement:{summary:"Performance Work Statement",details:"This is a sample performance work statement",complianceStatus:"compliant",notes:"These are sample PWS notes"},submissionRequirements:{details:["Submit proposal by deadline","Include all required documentation"],notes:["Follow submission format","Provide detailed responses"]},evaluationFactors:{summary:"Evaluation Factors",details:"These are sample evaluation factors",complianceStatus:"compliant",notes:"These are sample evaluation notes"},complianceRequirements:[{clause:"1.1",description:"Description of requirement 1",proposalSection:"Scope of Work",pageNumber:"5",isCompliant:!0},{clause:"2.3",description:"Description of requirement 2",proposalSection:"Technical Requirements",pageNumber:"8",isCompliant:!1}]},ze=()=>{const{proposals:e}=q(),[r,l]=w.useState(!1),[i,t]=w.useState({pws:null,instructions:null}),[o,a]=w.useState(null),m=n=>{var v;const c=(v=n.target.files)==null?void 0:v[0];if(!c){d.error("No file selected");return}const N=n.target.id;if(N==="sow-upload")t(A=>({...A,pws:c}));else if(N==="instructions-upload")t(A=>({...A,instructions:c}));else{d.error("Invalid file input");return}d.success("File uploaded successfully")},p=async()=>{if(!i.pws||!i.instructions){d.error("Please upload both documents first");return}l(!0);try{const n=await u();a(n),d.success("Analysis complete")}catch(n){d.error("Error analyzing documents"),console.error(n)}finally{l(!1)}},u=async()=>Se,f=n=>n?s.jsxDEV("div",{className:"bg-white p-6 rounded-lg shadow",children:[s.jsxDEV("h3",{className:"text-lg font-medium mb-4",children:n.summary},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:147,columnNumber:9},void 0),s.jsxDEV("div",{className:"space-y-4",children:Array.isArray(n.details)?s.jsxDEV("ul",{className:"list-disc list-inside text-gray-600",children:n.details.map((c,N)=>s.jsxDEV("li",{children:c},N,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:152,columnNumber:17},void 0))},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:150,columnNumber:13},void 0):s.jsxDEV("p",{className:"text-gray-600",children:n.details},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:156,columnNumber:13},void 0)},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:148,columnNumber:9},void 0),Array.isArray(n.notes)?s.jsxDEV("div",{className:"mt-4 p-4 bg-gray-50 rounded",children:s.jsxDEV("ul",{className:"list-disc list-inside text-gray-500",children:n.notes.map((c,N)=>s.jsxDEV("li",{children:c},N,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:163,columnNumber:17},void 0))},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:161,columnNumber:13},void 0)},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:160,columnNumber:11},void 0):n.notes&&s.jsxDEV("div",{className:"mt-4 p-4 bg-gray-50 rounded",children:s.jsxDEV("p",{className:"text-sm text-gray-500",children:n.notes},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:169,columnNumber:13},void 0)},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:168,columnNumber:11},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:146,columnNumber:7},void 0):null,g=n=>n?s.jsxDEV("div",{className:"bg-white p-6 rounded-lg shadow",children:[s.jsxDEV("h3",{className:"text-lg font-medium mb-4",children:"Submission Requirements"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:180,columnNumber:9},void 0),s.jsxDEV("div",{className:"space-y-4",children:n.details.map((c,N)=>s.jsxDEV("div",{className:"p-4 bg-gray-50 rounded",children:s.jsxDEV("p",{className:"text-gray-600",children:c},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:184,columnNumber:15},void 0)},N,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:183,columnNumber:13},void 0))},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:181,columnNumber:9},void 0),Array.isArray(n.notes)?s.jsxDEV("div",{className:"mt-4 p-4 bg-gray-50 rounded",children:s.jsxDEV("ul",{className:"list-disc list-inside text-gray-500",children:n.notes.map((c,N)=>s.jsxDEV("li",{children:c},N,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:192,columnNumber:17},void 0))},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:190,columnNumber:13},void 0)},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:189,columnNumber:11},void 0):n.notes&&s.jsxDEV("div",{className:"mt-4 p-4 bg-gray-50 rounded",children:s.jsxDEV("p",{className:"text-sm text-gray-500",children:n.notes},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:198,columnNumber:13},void 0)},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:197,columnNumber:11},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:179,columnNumber:7},void 0):null,y=n=>n!=null&&n.length?s.jsxDEV("div",{className:"bg-white p-6 rounded-lg shadow",children:[s.jsxDEV("h3",{className:"text-lg font-medium mb-4",children:"Compliance Matrix"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:209,columnNumber:9},void 0),s.jsxDEV("div",{className:"overflow-x-auto",children:s.jsxDEV("table",{className:"min-w-full",children:[s.jsxDEV("thead",{children:s.jsxDEV("tr",{children:[s.jsxDEV("th",{className:"px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Clause"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:214,columnNumber:17},void 0),s.jsxDEV("th",{className:"px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Description"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:217,columnNumber:17},void 0),s.jsxDEV("th",{className:"px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Proposal Section"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:220,columnNumber:17},void 0),s.jsxDEV("th",{className:"px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Page Number"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:223,columnNumber:17},void 0),s.jsxDEV("th",{className:"px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Status"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:226,columnNumber:17},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:213,columnNumber:15},void 0)},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:212,columnNumber:13},void 0),s.jsxDEV("tbody",{className:"bg-white divide-y divide-gray-200",children:n.map((c,N)=>s.jsxDEV("tr",{children:[s.jsxDEV("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:c.clause},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:234,columnNumber:19},void 0),s.jsxDEV("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:c.description},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:235,columnNumber:19},void 0),s.jsxDEV("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:c.proposalSection},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:236,columnNumber:19},void 0),s.jsxDEV("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:c.pageNumber},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:237,columnNumber:19},void 0),s.jsxDEV("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:s.jsxDEV("span",{className:`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.isCompliant?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}`,children:c.isCompliant?"Compliant":"Non-Compliant"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:239,columnNumber:21},void 0)},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:238,columnNumber:19},void 0)]},N,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:233,columnNumber:17},void 0))},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:231,columnNumber:13},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:211,columnNumber:11},void 0)},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:210,columnNumber:9},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:208,columnNumber:7},void 0):null,I=n=>n?s.jsxDEV("div",{className:"bg-white p-6 rounded-lg shadow",children:[s.jsxDEV("h3",{className:"text-lg font-medium mb-4",children:"Key Terms"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:258,columnNumber:9},void 0),s.jsxDEV("div",{className:"space-y-4",children:Object.entries(n).map(([c,N])=>s.jsxDEV("div",{children:[s.jsxDEV("h4",{className:"text-base font-medium mb-2",children:c.charAt(0).toUpperCase()+c.slice(1)},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:262,columnNumber:15},void 0),s.jsxDEV("div",{className:"space-y-4",children:N.map((v,A)=>s.jsxDEV("div",{className:"p-4 bg-gray-50 rounded",children:[s.jsxDEV("h5",{className:"font-medium text-gray-900",children:v.term},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:266,columnNumber:21},void 0),s.jsxDEV("p",{className:"mt-2 text-gray-600",children:v.context},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:267,columnNumber:21},void 0),s.jsxDEV("p",{className:"mt-1 text-sm text-gray-500",children:["Section: ",v.section]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:268,columnNumber:21},void 0)]},A,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:265,columnNumber:19},void 0))},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:263,columnNumber:15},void 0)]},c,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:261,columnNumber:13},void 0))},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:259,columnNumber:9},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:257,columnNumber:7},void 0):null;return s.jsxDEV("div",{className:"container mx-auto px-4 py-8",children:s.jsxDEV("div",{className:"max-w-4xl mx-auto",children:s.jsxDEV("div",{className:"space-y-6",children:[s.jsxDEV("div",{children:[s.jsxDEV("h1",{className:"text-3xl font-bold mb-4",children:"SOW Analyzer"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:284,columnNumber:13},void 0),s.jsxDEV("div",{className:"grid grid-cols-2 gap-4",children:[s.jsxDEV("div",{children:[s.jsxDEV("label",{htmlFor:"sow-upload",className:"block text-sm font-medium text-gray-700 mb-2",children:"Upload SOW"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:287,columnNumber:17},void 0),s.jsxDEV("input",{id:"sow-upload",type:"file",accept:".pdf,.doc,.docx",onChange:m,className:"block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:290,columnNumber:17},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:286,columnNumber:15},void 0),s.jsxDEV("div",{children:[s.jsxDEV("label",{htmlFor:"instructions-upload",className:"block text-sm font-medium text-gray-700 mb-2",children:"Upload Instructions"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:299,columnNumber:17},void 0),s.jsxDEV("input",{id:"instructions-upload",type:"file",accept:".pdf,.doc,.docx",onChange:m,className:"block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:302,columnNumber:17},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:298,columnNumber:15},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:285,columnNumber:13},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:283,columnNumber:11},void 0),s.jsxDEV("button",{onClick:p,disabled:r,className:"inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",children:r?s.jsxDEV(s.Fragment,{children:[s.jsxDEV(V,{className:"animate-spin mr-2 h-5 w-5 text-white"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:320,columnNumber:17},void 0),"Analyzing..."]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:319,columnNumber:15},void 0):s.jsxDEV(s.Fragment,{children:[s.jsxDEV(V,{className:"mr-2 h-5 w-5 text-white"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:325,columnNumber:17},void 0),"Analyze Documents"]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:324,columnNumber:15},void 0)},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:313,columnNumber:11},void 0),o&&s.jsxDEV("div",{className:"space-y-6",children:[s.jsxDEV("div",{className:"grid grid-cols-2 gap-6",children:[s.jsxDEV("div",{children:f(o.scopeOfWork)},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:334,columnNumber:17},void 0),s.jsxDEV("div",{children:f(o.technicalRequirements)},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:337,columnNumber:17},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:333,columnNumber:15},void 0),s.jsxDEV("div",{children:[s.jsxDEV("h3",{className:"text-lg font-medium mb-4",children:"Contract Requirements"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:343,columnNumber:17},void 0),s.jsxDEV("div",{className:"space-y-6",children:[s.jsxDEV("div",{className:"bg-white p-6 rounded-lg shadow",children:[s.jsxDEV("h4",{className:"text-base font-medium mb-4",children:"Type of Contract"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:346,columnNumber:21},void 0),s.jsxDEV("div",{className:"space-y-2",children:o.contractRequirements.typeOfContract.map((n,c)=>s.jsxDEV("p",{className:"text-gray-600",children:n},c,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:349,columnNumber:25},void 0))},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:347,columnNumber:21},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:345,columnNumber:19},void 0),s.jsxDEV("div",{className:"bg-white p-6 rounded-lg shadow",children:[s.jsxDEV("h4",{className:"text-base font-medium mb-4",children:"Option Periods"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:355,columnNumber:21},void 0),s.jsxDEV("div",{className:"space-y-2",children:o.contractRequirements.optionPeriods.map((n,c)=>s.jsxDEV("p",{className:"text-gray-600",children:n},c,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:358,columnNumber:25},void 0))},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:356,columnNumber:21},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:354,columnNumber:19},void 0),s.jsxDEV("div",{className:"bg-white p-6 rounded-lg shadow",children:[s.jsxDEV("h4",{className:"text-base font-medium mb-4",children:"Period of Performance"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:364,columnNumber:21},void 0),s.jsxDEV("div",{className:"space-y-2",children:o.contractRequirements.periodOfPerformance.map((n,c)=>s.jsxDEV("p",{className:"text-gray-600",children:n},c,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:367,columnNumber:25},void 0))},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:365,columnNumber:21},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:363,columnNumber:19},void 0),s.jsxDEV("div",{className:"bg-white p-6 rounded-lg shadow",children:[s.jsxDEV("h4",{className:"text-base font-medium mb-4",children:"Place of Performance"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:373,columnNumber:21},void 0),s.jsxDEV("div",{className:"space-y-2",children:o.contractRequirements.placeOfPerformance.map((n,c)=>s.jsxDEV("p",{className:"text-gray-600",children:n},c,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:376,columnNumber:25},void 0))},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:374,columnNumber:21},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:372,columnNumber:19},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:344,columnNumber:17},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:342,columnNumber:15},void 0),s.jsxDEV("div",{children:[s.jsxDEV("h3",{className:"text-lg font-medium mb-4",children:"Key Terms"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:384,columnNumber:17},void 0),I(o.keyTerms)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:383,columnNumber:15},void 0),s.jsxDEV("div",{children:[s.jsxDEV("h3",{className:"text-lg font-medium mb-4",children:"Submission Requirements"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:389,columnNumber:17},void 0),g(o.submissionRequirements)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:388,columnNumber:15},void 0),s.jsxDEV("div",{children:[s.jsxDEV("h3",{className:"text-lg font-medium mb-4",children:"Evaluation Factors"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:394,columnNumber:17},void 0),f(o.evaluationFactors)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:393,columnNumber:15},void 0),s.jsxDEV("div",{children:[s.jsxDEV("h3",{className:"text-lg font-medium mb-4",children:"Compliance Requirements"},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:399,columnNumber:17},void 0),y(o.complianceRequirements)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:398,columnNumber:15},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:332,columnNumber:13},void 0)]},void 0,!0,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:282,columnNumber:9},void 0)},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:281,columnNumber:7},void 0)},void 0,!1,{fileName:"/mnt/c/Users/ericw/proposal-flow/proposal-flow/src/pages/SOWAnalyzer.jsx",lineNumber:280,columnNumber:5},void 0)};export{ze as default};
