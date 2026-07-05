import{a as L,j as t}from"./main.Cn5NSbFw.js";import{r as h}from"./react-vendor.CU0qWKOP.js";import{l as O}from"./ui-lib.BBZdIGQh.js";let M={data:""},U=e=>{if(typeof window=="object"){let s=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return s.nonce=window.__nonce__,s.parentNode||(e||document.head).appendChild(s),s.firstChild}return e||M},K=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,H=/\/\*[^]*?\*\/|  +/g,E=/\n+/g,v=(e,s)=>{let a="",o="",n="";for(let r in e){let i=e[r];r[0]=="@"?r[1]=="i"?a=r+" "+i+";":o+=r[1]=="f"?v(i,r):r+"{"+v(i,r[1]=="k"?"":s)+"}":typeof i=="object"?o+=v(i,s?s.replace(/([^,])+/g,d=>r.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,m=>/&/.test(m)?m.replace(/&/g,d):d?d+" "+m:m)):r):i!=null&&(r=/^--/.test(r)?r:r.replace(/[A-Z]/g,"-$&").toLowerCase(),n+=v.p?v.p(r,i):r+":"+i+";")}return a+(s&&n?s+"{"+n+"}":n)+o},g={},F=e=>{if(typeof e=="object"){let s="";for(let a in e)s+=a+F(e[a]);return s}return e},Z=(e,s,a,o,n)=>{let r=F(e),i=g[r]||(g[r]=(m=>{let u=0,x=11;for(;u<m.length;)x=101*x+m.charCodeAt(u++)>>>0;return"go"+x})(r));if(!g[i]){let m=r!==e?e:(u=>{let x,b,j=[{}];for(;x=K.exec(u.replace(H,""));)x[4]?j.shift():x[3]?(b=x[3].replace(E," ").trim(),j.unshift(j[0][b]=j[0][b]||{})):j[0][x[1]]=x[2].replace(E," ").trim();return j[0]})(e);g[i]=v(n?{["@keyframes "+i]:m}:m,a?"":"."+i)}let d=a&&g.g?g.g:null;return a&&(g.g=g[i]),((m,u,x,b)=>{b?u.data=u.data.replace(b,m):u.data.indexOf(m)===-1&&(u.data=x?m+u.data:u.data+m)})(g[i],s,o,d),i},Q=(e,s,a)=>e.reduce((o,n,r)=>{let i=s[r];if(i&&i.call){let d=i(a),m=d&&d.props&&d.props.className||/^go/.test(d)&&d;i=m?"."+m:d&&typeof d=="object"?d.props?"":v(d,""):d===!1?"":d}return o+n+(i??"")},"");function T(e){let s=this||{},a=e.call?e(s.p):e;return Z(a.unshift?a.raw?Q(a,[].slice.call(arguments,1),s.p):a.reduce((o,n)=>Object.assign(o,n&&n.call?n(s.p):n),{}):a,U(s.target),s.g,s.o,s.k)}let z,A,P;T.bind({g:1});let y=T.bind({k:1});function Y(e,s,a,o){v.p=s,z=e,A=a,P=o}function w(e,s){let a=this||{};return function(){let o=arguments;function n(r,i){let d=Object.assign({},r),m=d.className||n.className;a.p=Object.assign({theme:A&&A()},d),a.o=/ *go\d+/.test(m),d.className=T.apply(a,o)+(m?" "+m:"");let u=e;return e[0]&&(u=d.as||e,delete d.as),P&&u[0]&&P(d),z(u,d)}return n}}var B=e=>typeof e=="function",R=(e,s)=>B(e)?e(s):e,G=(()=>{let e=0;return()=>(++e).toString()})(),J=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let s=matchMedia("(prefers-reduced-motion: reduce)");e=!s||s.matches}return e}})(),V=20,I="default",W=(e,s)=>{let{toastLimit:a}=e.settings;switch(s.type){case 0:return{...e,toasts:[s.toast,...e.toasts].slice(0,a)};case 1:return{...e,toasts:e.toasts.map(i=>i.id===s.toast.id?{...i,...s.toast}:i)};case 2:let{toast:o}=s;return W(e,{type:e.toasts.find(i=>i.id===o.id)?1:0,toast:o});case 3:let{toastId:n}=s;return{...e,toasts:e.toasts.map(i=>i.id===n||n===void 0?{...i,dismissed:!0,visible:!1}:i)};case 4:return s.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(i=>i.id!==s.toastId)};case 5:return{...e,pausedAt:s.time};case 6:let r=s.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(i=>({...i,pauseDuration:i.pauseDuration+r}))}}},X=[],ee={toasts:[],pausedAt:void 0,settings:{toastLimit:V}},k={},D=(e,s=I)=>{k[s]=W(k[s]||ee,e),X.forEach(([a,o])=>{a===s&&o(k[s])})},q=e=>Object.keys(k).forEach(s=>D(e,s)),te=e=>Object.keys(k).find(s=>k[s].toasts.some(a=>a.id===e)),$=(e=I)=>s=>{D(s,e)},se=(e,s="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:s,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:(a==null?void 0:a.id)||G()}),C=e=>(s,a)=>{let o=se(s,e,a);return $(o.toasterId||te(o.id))({type:2,toast:o}),o.id},p=(e,s)=>C("blank")(e,s);p.error=C("error");p.success=C("success");p.loading=C("loading");p.custom=C("custom");p.dismiss=(e,s)=>{let a={type:3,toastId:e};s?$(s)(a):q(a)};p.dismissAll=e=>p.dismiss(void 0,e);p.remove=(e,s)=>{let a={type:4,toastId:e};s?$(s)(a):q(a)};p.removeAll=e=>p.remove(void 0,e);p.promise=(e,s,a)=>{let o=p.loading(s.loading,{...a,...a==null?void 0:a.loading});return typeof e=="function"&&(e=e()),e.then(n=>{let r=s.success?R(s.success,n):void 0;return r?p.success(r,{id:o,...a,...a==null?void 0:a.success}):p.dismiss(o),n}).catch(n=>{let r=s.error?R(s.error,n):void 0;r?p.error(r,{id:o,...a,...a==null?void 0:a.error}):p.dismiss(o)}),e};var ae=y`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,re=y`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ie=y`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,oe=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${ae} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${re} 0.15s ease-out forwards;
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
    animation: ${ie} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,le=y`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,ne=w("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${le} 1s linear infinite;
`,ce=y`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,de=y`
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
}`,me=w("div")`
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
    animation: ${de} 0.2s ease-out forwards;
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
`,pe=w("div")`
  position: absolute;
`,ue=w("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,xe=y`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,he=w("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${xe} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,fe=({toast:e})=>{let{icon:s,type:a,iconTheme:o}=e;return s!==void 0?typeof s=="string"?h.createElement(he,null,s):s:a==="blank"?null:h.createElement(ue,null,h.createElement(ne,{...o}),a!=="loading"&&h.createElement(pe,null,a==="error"?h.createElement(oe,{...o}):h.createElement(me,{...o})))},ge=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,ye=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,be="0%{opacity:0;} 100%{opacity:1;}",je="0%{opacity:1;} 100%{opacity:0;}",ve=w("div")`
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
`,we=w("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Ne=(e,s)=>{let a=e.includes("top")?1:-1,[o,n]=J()?[be,je]:[ge(a),ye(a)];return{animation:s?`${y(o)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${y(n)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};h.memo(({toast:e,position:s,style:a,children:o})=>{let n=e.height?Ne(e.position||s||"top-center",e.visible):{opacity:0},r=h.createElement(fe,{toast:e}),i=h.createElement(we,{...e.ariaProps},R(e.message,e));return h.createElement(ve,{className:e.className,style:{...n,...a,...e.style}},typeof o=="function"?o({icon:r,message:i}):h.createElement(h.Fragment,null,r,i))});Y(h.createElement);T`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;const ke={scopeOfWork:{summary:"Overview",details:"This is a sample overview text",complianceStatus:"compliant",notes:"These are sample notes"},technicalRequirements:{summary:"Technical Requirements",details:"These are sample technical requirements",complianceStatus:"compliant",notes:"These are sample technical notes"},contractRequirements:{typeOfContract:["Fixed Price"],optionPeriods:["1 year"],periodOfPerformance:["12 months"],placeOfPerformance:["Client Site"]},keyTerms:{must:[{term:"Must Term",context:"This term must be met",section:"Technical Requirements"}],shall:[{term:"Shall Term",context:"This term shall be followed",section:"Contract Requirements"}],will:[{term:"Will Term",context:"This term will be implemented",section:"Scope of Work"}],otherCritical:[{term:"Critical Term",context:"This is a critical term",section:"Compliance"}]},performanceWorkStatement:{summary:"Performance Work Statement",details:"This is a sample performance work statement",complianceStatus:"compliant",notes:"These are sample PWS notes"},submissionRequirements:{details:["Submit proposal by deadline","Include all required documentation"],notes:["Follow submission format","Provide detailed responses"]},evaluationFactors:{summary:"Evaluation Factors",details:"These are sample evaluation factors",complianceStatus:"compliant",notes:"These are sample evaluation notes"},complianceRequirements:[{clause:"1.1",description:"Description of requirement 1",proposalSection:"Scope of Work",pageNumber:"5",isCompliant:!0},{clause:"2.3",description:"Description of requirement 2",proposalSection:"Technical Requirements",pageNumber:"8",isCompliant:!1}]},Ae=()=>{const{proposals:e}=L(),[s,a]=h.useState(!1),[o,n]=h.useState({pws:null,instructions:null}),[r,i]=h.useState(null),d=l=>{var N;const c=(N=l.target.files)==null?void 0:N[0];if(!c){p.error("No file selected");return}const f=l.target.id;if(f==="sow-upload")n(S=>({...S,pws:c}));else if(f==="instructions-upload")n(S=>({...S,instructions:c}));else{p.error("Invalid file input");return}p.success("File uploaded successfully")},m=async()=>{if(!o.pws||!o.instructions){p.error("Please upload both documents first");return}a(!0);try{const l=await u();i(l),p.success("Analysis complete")}catch(l){p.error("Error analyzing documents"),console.error(l)}finally{a(!1)}},u=async()=>ke,x=l=>l?t.jsxs("div",{className:"bg-white p-6 rounded-lg shadow",children:[t.jsx("h3",{className:"text-lg font-medium mb-4",children:l.summary}),t.jsx("div",{className:"space-y-4",children:Array.isArray(l.details)?t.jsx("ul",{className:"list-disc list-inside text-gray-600",children:l.details.map((c,f)=>t.jsx("li",{children:c},f))}):t.jsx("p",{className:"text-gray-600",children:l.details})}),Array.isArray(l.notes)?t.jsx("div",{className:"mt-4 p-4 bg-gray-50 rounded",children:t.jsx("ul",{className:"list-disc list-inside text-gray-500",children:l.notes.map((c,f)=>t.jsx("li",{children:c},f))})}):l.notes&&t.jsx("div",{className:"mt-4 p-4 bg-gray-50 rounded",children:t.jsx("p",{className:"text-sm text-gray-500",children:l.notes})})]}):null,b=l=>l?t.jsxs("div",{className:"bg-white p-6 rounded-lg shadow",children:[t.jsx("h3",{className:"text-lg font-medium mb-4",children:"Submission Requirements"}),t.jsx("div",{className:"space-y-4",children:l.details.map((c,f)=>t.jsx("div",{className:"p-4 bg-gray-50 rounded",children:t.jsx("p",{className:"text-gray-600",children:c})},f))}),Array.isArray(l.notes)?t.jsx("div",{className:"mt-4 p-4 bg-gray-50 rounded",children:t.jsx("ul",{className:"list-disc list-inside text-gray-500",children:l.notes.map((c,f)=>t.jsx("li",{children:c},f))})}):l.notes&&t.jsx("div",{className:"mt-4 p-4 bg-gray-50 rounded",children:t.jsx("p",{className:"text-sm text-gray-500",children:l.notes})})]}):null,j=l=>l!=null&&l.length?t.jsxs("div",{className:"bg-white p-6 rounded-lg shadow",children:[t.jsx("h3",{className:"text-lg font-medium mb-4",children:"Compliance Matrix"}),t.jsx("div",{className:"overflow-x-auto",children:t.jsxs("table",{className:"min-w-full",children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx("th",{className:"px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Clause"}),t.jsx("th",{className:"px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Description"}),t.jsx("th",{className:"px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Proposal Section"}),t.jsx("th",{className:"px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Page Number"}),t.jsx("th",{className:"px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Status"})]})}),t.jsx("tbody",{className:"bg-white divide-y divide-gray-200",children:l.map((c,f)=>t.jsxs("tr",{children:[t.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:c.clause}),t.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:c.description}),t.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:c.proposalSection}),t.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:c.pageNumber}),t.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:t.jsx("span",{className:`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.isCompliant?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}`,children:c.isCompliant?"Compliant":"Non-Compliant"})})]},f))})]})})]}):null,_=l=>l?t.jsxs("div",{className:"bg-white p-6 rounded-lg shadow",children:[t.jsx("h3",{className:"text-lg font-medium mb-4",children:"Key Terms"}),t.jsx("div",{className:"space-y-4",children:Object.entries(l).map(([c,f])=>t.jsxs("div",{children:[t.jsx("h4",{className:"text-base font-medium mb-2",children:c.charAt(0).toUpperCase()+c.slice(1)}),t.jsx("div",{className:"space-y-4",children:f.map((N,S)=>t.jsxs("div",{className:"p-4 bg-gray-50 rounded",children:[t.jsx("h5",{className:"font-medium text-gray-900",children:N.term}),t.jsx("p",{className:"mt-2 text-gray-600",children:N.context}),t.jsxs("p",{className:"mt-1 text-sm text-gray-500",children:["Section: ",N.section]})]},S))})]},c))})]}):null;return t.jsx("div",{className:"container mx-auto px-4 py-8",children:t.jsx("div",{className:"max-w-4xl mx-auto",children:t.jsxs("div",{className:"space-y-6",children:[t.jsxs("div",{children:[t.jsx("h1",{className:"text-3xl font-bold mb-4",children:"SOW Analyzer"}),t.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[t.jsxs("div",{children:[t.jsx("label",{htmlFor:"sow-upload",className:"block text-sm font-medium text-gray-700 mb-2",children:"Upload SOW"}),t.jsx("input",{id:"sow-upload",type:"file",accept:".pdf,.doc,.docx",onChange:d,className:"block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"})]}),t.jsxs("div",{children:[t.jsx("label",{htmlFor:"instructions-upload",className:"block text-sm font-medium text-gray-700 mb-2",children:"Upload Instructions"}),t.jsx("input",{id:"instructions-upload",type:"file",accept:".pdf,.doc,.docx",onChange:d,className:"block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"})]})]})]}),t.jsx("button",{onClick:m,disabled:s,className:"inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",children:s?t.jsxs(t.Fragment,{children:[t.jsx(O,{className:"animate-spin mr-2 h-5 w-5 text-white"}),"Analyzing..."]}):t.jsxs(t.Fragment,{children:[t.jsx(O,{className:"mr-2 h-5 w-5 text-white"}),"Analyze Documents"]})}),r&&t.jsxs("div",{className:"space-y-6",children:[t.jsxs("div",{className:"grid grid-cols-2 gap-6",children:[t.jsx("div",{children:x(r.scopeOfWork)}),t.jsx("div",{children:x(r.technicalRequirements)})]}),t.jsxs("div",{children:[t.jsx("h3",{className:"text-lg font-medium mb-4",children:"Contract Requirements"}),t.jsxs("div",{className:"space-y-6",children:[t.jsxs("div",{className:"bg-white p-6 rounded-lg shadow",children:[t.jsx("h4",{className:"text-base font-medium mb-4",children:"Type of Contract"}),t.jsx("div",{className:"space-y-2",children:r.contractRequirements.typeOfContract.map((l,c)=>t.jsx("p",{className:"text-gray-600",children:l},c))})]}),t.jsxs("div",{className:"bg-white p-6 rounded-lg shadow",children:[t.jsx("h4",{className:"text-base font-medium mb-4",children:"Option Periods"}),t.jsx("div",{className:"space-y-2",children:r.contractRequirements.optionPeriods.map((l,c)=>t.jsx("p",{className:"text-gray-600",children:l},c))})]}),t.jsxs("div",{className:"bg-white p-6 rounded-lg shadow",children:[t.jsx("h4",{className:"text-base font-medium mb-4",children:"Period of Performance"}),t.jsx("div",{className:"space-y-2",children:r.contractRequirements.periodOfPerformance.map((l,c)=>t.jsx("p",{className:"text-gray-600",children:l},c))})]}),t.jsxs("div",{className:"bg-white p-6 rounded-lg shadow",children:[t.jsx("h4",{className:"text-base font-medium mb-4",children:"Place of Performance"}),t.jsx("div",{className:"space-y-2",children:r.contractRequirements.placeOfPerformance.map((l,c)=>t.jsx("p",{className:"text-gray-600",children:l},c))})]})]})]}),t.jsxs("div",{children:[t.jsx("h3",{className:"text-lg font-medium mb-4",children:"Key Terms"}),_(r.keyTerms)]}),t.jsxs("div",{children:[t.jsx("h3",{className:"text-lg font-medium mb-4",children:"Submission Requirements"}),b(r.submissionRequirements)]}),t.jsxs("div",{children:[t.jsx("h3",{className:"text-lg font-medium mb-4",children:"Evaluation Factors"}),x(r.evaluationFactors)]}),t.jsxs("div",{children:[t.jsx("h3",{className:"text-lg font-medium mb-4",children:"Compliance Requirements"}),j(r.complianceRequirements)]})]})]})})})};export{Ae as default};
