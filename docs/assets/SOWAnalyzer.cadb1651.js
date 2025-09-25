import{a as L,j as t}from"./main.84a19ea1.js";import{r as x}from"./react-vendor.36470f4f.js";import{R as O}from"./ui-lib.676c71c1.js";let M={data:""},U=e=>typeof window=="object"?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||M,_=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,K=/\/\*[^]*?\*\/|  +/g,E=/\n+/g,v=(e,s)=>{let a="",l="",i="";for(let n in e){let r=e[n];n[0]=="@"?n[1]=="i"?a=n+" "+r+";":l+=n[1]=="f"?v(r,n):n+"{"+v(r,n[1]=="k"?"":s)+"}":typeof r=="object"?l+=v(r,s?s.replace(/([^,])+/g,d=>n.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,m=>/&/.test(m)?m.replace(/&/g,d):d?d+" "+m:m)):n):r!=null&&(n=/^--/.test(n)?n:n.replace(/[A-Z]/g,"-$&").toLowerCase(),i+=v.p?v.p(n,r):n+":"+r+";")}return a+(s&&i?s+"{"+i+"}":i)+l},g={},F=e=>{if(typeof e=="object"){let s="";for(let a in e)s+=a+F(e[a]);return s}return e},H=(e,s,a,l,i)=>{let n=F(e),r=g[n]||(g[n]=(m=>{let u=0,h=11;for(;u<m.length;)h=101*h+m.charCodeAt(u++)>>>0;return"go"+h})(n));if(!g[r]){let m=n!==e?e:(u=>{let h,b,j=[{}];for(;h=_.exec(u.replace(K,""));)h[4]?j.shift():h[3]?(b=h[3].replace(E," ").trim(),j.unshift(j[0][b]=j[0][b]||{})):j[0][h[1]]=h[2].replace(E," ").trim();return j[0]})(e);g[r]=v(i?{["@keyframes "+r]:m}:m,a?"":"."+r)}let d=a&&g.g?g.g:null;return a&&(g.g=g[r]),((m,u,h,b)=>{b?u.data=u.data.replace(b,m):u.data.indexOf(m)===-1&&(u.data=h?m+u.data:u.data+m)})(g[r],s,l,d),r},Z=(e,s,a)=>e.reduce((l,i,n)=>{let r=s[n];if(r&&r.call){let d=r(a),m=d&&d.props&&d.props.className||/^go/.test(d)&&d;r=m?"."+m:d&&typeof d=="object"?d.props?"":v(d,""):d===!1?"":d}return l+i+(r??"")},"");function T(e){let s=this||{},a=e.call?e(s.p):e;return H(a.unshift?a.raw?Z(a,[].slice.call(arguments,1),s.p):a.reduce((l,i)=>Object.assign(l,i&&i.call?i(s.p):i),{}):a,U(s.target),s.g,s.o,s.k)}let z,A,R;T.bind({g:1});let y=T.bind({k:1});function Q(e,s,a,l){v.p=s,z=e,A=a,R=l}function w(e,s){let a=this||{};return function(){let l=arguments;function i(n,r){let d=Object.assign({},n),m=d.className||i.className;a.p=Object.assign({theme:A&&A()},d),a.o=/ *go\d+/.test(m),d.className=T.apply(a,l)+(m?" "+m:""),s&&(d.ref=r);let u=e;return e[0]&&(u=d.as||e,delete d.as),R&&u[0]&&R(d),z(u,d)}return s?s(i):i}}var Y=e=>typeof e=="function",$=(e,s)=>Y(e)?e(s):e,B=(()=>{let e=0;return()=>(++e).toString()})(),G=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let s=matchMedia("(prefers-reduced-motion: reduce)");e=!s||s.matches}return e}})(),J=20,I="default",W=(e,s)=>{let{toastLimit:a}=e.settings;switch(s.type){case 0:return{...e,toasts:[s.toast,...e.toasts].slice(0,a)};case 1:return{...e,toasts:e.toasts.map(r=>r.id===s.toast.id?{...r,...s.toast}:r)};case 2:let{toast:l}=s;return W(e,{type:e.toasts.find(r=>r.id===l.id)?1:0,toast:l});case 3:let{toastId:i}=s;return{...e,toasts:e.toasts.map(r=>r.id===i||i===void 0?{...r,dismissed:!0,visible:!1}:r)};case 4:return s.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(r=>r.id!==s.toastId)};case 5:return{...e,pausedAt:s.time};case 6:let n=s.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(r=>({...r,pauseDuration:r.pauseDuration+n}))}}},V=[],X={toasts:[],pausedAt:void 0,settings:{toastLimit:J}},k={},D=(e,s=I)=>{k[s]=W(k[s]||X,e),V.forEach(([a,l])=>{a===s&&l(k[s])})},q=e=>Object.keys(k).forEach(s=>D(e,s)),ee=e=>Object.keys(k).find(s=>k[s].toasts.some(a=>a.id===e)),P=(e=I)=>s=>{D(s,e)},te=(e,s="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:s,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:(a==null?void 0:a.id)||B()}),C=e=>(s,a)=>{let l=te(s,e,a);return P(l.toasterId||ee(l.id))({type:2,toast:l}),l.id},p=(e,s)=>C("blank")(e,s);p.error=C("error");p.success=C("success");p.loading=C("loading");p.custom=C("custom");p.dismiss=(e,s)=>{let a={type:3,toastId:e};s?P(s)(a):q(a)};p.dismissAll=e=>p.dismiss(void 0,e);p.remove=(e,s)=>{let a={type:4,toastId:e};s?P(s)(a):q(a)};p.removeAll=e=>p.remove(void 0,e);p.promise=(e,s,a)=>{let l=p.loading(s.loading,{...a,...a==null?void 0:a.loading});return typeof e=="function"&&(e=e()),e.then(i=>{let n=s.success?$(s.success,i):void 0;return n?p.success(n,{id:l,...a,...a==null?void 0:a.success}):p.dismiss(l),i}).catch(i=>{let n=s.error?$(s.error,i):void 0;n?p.error(n,{id:l,...a,...a==null?void 0:a.error}):p.dismiss(l)}),e};var se=y`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,ae=y`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,re=y`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,ie=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${se} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${ae} 0.15s ease-out forwards;
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
    animation: ${re} 0.15s ease-out forwards;
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
`,oe=w("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${le} 1s linear infinite;
`,ne=y`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,ce=y`
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
}`,de=w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${ne} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${ce} 0.2s ease-out forwards;
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
`,me=w("div")`
  position: absolute;
`,pe=w("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,ue=y`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,xe=w("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${ue} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,he=({toast:e})=>{let{icon:s,type:a,iconTheme:l}=e;return s!==void 0?typeof s=="string"?x.createElement(xe,null,s):s:a==="blank"?null:x.createElement(pe,null,x.createElement(oe,{...l}),a!=="loading"&&x.createElement(me,null,a==="error"?x.createElement(ie,{...l}):x.createElement(de,{...l})))},fe=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,ge=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,ye="0%{opacity:0;} 100%{opacity:1;}",be="0%{opacity:1;} 100%{opacity:0;}",je=w("div")`
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
`,ve=w("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,we=(e,s)=>{let a=e.includes("top")?1:-1,[l,i]=G()?[ye,be]:[fe(a),ge(a)];return{animation:s?`${y(l)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${y(i)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};x.memo(({toast:e,position:s,style:a,children:l})=>{let i=e.height?we(e.position||s||"top-center",e.visible):{opacity:0},n=x.createElement(he,{toast:e}),r=x.createElement(ve,{...e.ariaProps},$(e.message,e));return x.createElement(je,{className:e.className,style:{...i,...a,...e.style}},typeof l=="function"?l({icon:n,message:r}):x.createElement(x.Fragment,null,n,r))});Q(x.createElement);T`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;const Ne={scopeOfWork:{summary:"Overview",details:"This is a sample overview text",complianceStatus:"compliant",notes:"These are sample notes"},technicalRequirements:{summary:"Technical Requirements",details:"These are sample technical requirements",complianceStatus:"compliant",notes:"These are sample technical notes"},contractRequirements:{typeOfContract:["Fixed Price"],optionPeriods:["1 year"],periodOfPerformance:["12 months"],placeOfPerformance:["Client Site"]},keyTerms:{must:[{term:"Must Term",context:"This term must be met",section:"Technical Requirements"}],shall:[{term:"Shall Term",context:"This term shall be followed",section:"Contract Requirements"}],will:[{term:"Will Term",context:"This term will be implemented",section:"Scope of Work"}],otherCritical:[{term:"Critical Term",context:"This is a critical term",section:"Compliance"}]},performanceWorkStatement:{summary:"Performance Work Statement",details:"This is a sample performance work statement",complianceStatus:"compliant",notes:"These are sample PWS notes"},submissionRequirements:{details:["Submit proposal by deadline","Include all required documentation"],notes:["Follow submission format","Provide detailed responses"]},evaluationFactors:{summary:"Evaluation Factors",details:"These are sample evaluation factors",complianceStatus:"compliant",notes:"These are sample evaluation notes"},complianceRequirements:[{clause:"1.1",description:"Description of requirement 1",proposalSection:"Scope of Work",pageNumber:"5",isCompliant:!0},{clause:"2.3",description:"Description of requirement 2",proposalSection:"Technical Requirements",pageNumber:"8",isCompliant:!1}]},Te=()=>{L();const[e,s]=x.useState(!1),[a,l]=x.useState({pws:null,instructions:null}),[i,n]=x.useState(null),r=o=>{var N;const c=(N=o.target.files)==null?void 0:N[0];if(!c){p.error("No file selected");return}const f=o.target.id;if(f==="sow-upload")l(S=>({...S,pws:c}));else if(f==="instructions-upload")l(S=>({...S,instructions:c}));else{p.error("Invalid file input");return}p.success("File uploaded successfully")},d=async()=>{if(!a.pws||!a.instructions){p.error("Please upload both documents first");return}s(!0);try{const o=await m();n(o),p.success("Analysis complete")}catch(o){p.error("Error analyzing documents"),console.error(o)}finally{s(!1)}},m=async()=>Ne,u=o=>o?t.jsxs("div",{className:"bg-white p-6 rounded-lg shadow",children:[t.jsx("h3",{className:"text-lg font-medium mb-4",children:o.summary}),t.jsx("div",{className:"space-y-4",children:Array.isArray(o.details)?t.jsx("ul",{className:"list-disc list-inside text-gray-600",children:o.details.map((c,f)=>t.jsx("li",{children:c},f))}):t.jsx("p",{className:"text-gray-600",children:o.details})}),Array.isArray(o.notes)?t.jsx("div",{className:"mt-4 p-4 bg-gray-50 rounded",children:t.jsx("ul",{className:"list-disc list-inside text-gray-500",children:o.notes.map((c,f)=>t.jsx("li",{children:c},f))})}):o.notes&&t.jsx("div",{className:"mt-4 p-4 bg-gray-50 rounded",children:t.jsx("p",{className:"text-sm text-gray-500",children:o.notes})})]}):null,h=o=>o?t.jsxs("div",{className:"bg-white p-6 rounded-lg shadow",children:[t.jsx("h3",{className:"text-lg font-medium mb-4",children:"Submission Requirements"}),t.jsx("div",{className:"space-y-4",children:o.details.map((c,f)=>t.jsx("div",{className:"p-4 bg-gray-50 rounded",children:t.jsx("p",{className:"text-gray-600",children:c})},f))}),Array.isArray(o.notes)?t.jsx("div",{className:"mt-4 p-4 bg-gray-50 rounded",children:t.jsx("ul",{className:"list-disc list-inside text-gray-500",children:o.notes.map((c,f)=>t.jsx("li",{children:c},f))})}):o.notes&&t.jsx("div",{className:"mt-4 p-4 bg-gray-50 rounded",children:t.jsx("p",{className:"text-sm text-gray-500",children:o.notes})})]}):null,b=o=>o!=null&&o.length?t.jsxs("div",{className:"bg-white p-6 rounded-lg shadow",children:[t.jsx("h3",{className:"text-lg font-medium mb-4",children:"Compliance Matrix"}),t.jsx("div",{className:"overflow-x-auto",children:t.jsxs("table",{className:"min-w-full",children:[t.jsx("thead",{children:t.jsxs("tr",{children:[t.jsx("th",{className:"px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Clause"}),t.jsx("th",{className:"px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Description"}),t.jsx("th",{className:"px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Proposal Section"}),t.jsx("th",{className:"px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Page Number"}),t.jsx("th",{className:"px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Status"})]})}),t.jsx("tbody",{className:"bg-white divide-y divide-gray-200",children:o.map((c,f)=>t.jsxs("tr",{children:[t.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:c.clause}),t.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:c.description}),t.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:c.proposalSection}),t.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:c.pageNumber}),t.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:t.jsx("span",{className:`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.isCompliant?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}`,children:c.isCompliant?"Compliant":"Non-Compliant"})})]},f))})]})})]}):null,j=o=>o?t.jsxs("div",{className:"bg-white p-6 rounded-lg shadow",children:[t.jsx("h3",{className:"text-lg font-medium mb-4",children:"Key Terms"}),t.jsx("div",{className:"space-y-4",children:Object.entries(o).map(([c,f])=>t.jsxs("div",{children:[t.jsx("h4",{className:"text-base font-medium mb-2",children:c.charAt(0).toUpperCase()+c.slice(1)}),t.jsx("div",{className:"space-y-4",children:f.map((N,S)=>t.jsxs("div",{className:"p-4 bg-gray-50 rounded",children:[t.jsx("h5",{className:"font-medium text-gray-900",children:N.term}),t.jsx("p",{className:"mt-2 text-gray-600",children:N.context}),t.jsxs("p",{className:"mt-1 text-sm text-gray-500",children:["Section: ",N.section]})]},S))})]},c))})]}):null;return t.jsx("div",{className:"container mx-auto px-4 py-8",children:t.jsx("div",{className:"max-w-4xl mx-auto",children:t.jsxs("div",{className:"space-y-6",children:[t.jsxs("div",{children:[t.jsx("h1",{className:"text-3xl font-bold mb-4",children:"SOW Analyzer"}),t.jsxs("div",{className:"grid grid-cols-2 gap-4",children:[t.jsxs("div",{children:[t.jsx("label",{htmlFor:"sow-upload",className:"block text-sm font-medium text-gray-700 mb-2",children:"Upload SOW"}),t.jsx("input",{id:"sow-upload",type:"file",accept:".pdf,.doc,.docx",onChange:r,className:"block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"})]}),t.jsxs("div",{children:[t.jsx("label",{htmlFor:"instructions-upload",className:"block text-sm font-medium text-gray-700 mb-2",children:"Upload Instructions"}),t.jsx("input",{id:"instructions-upload",type:"file",accept:".pdf,.doc,.docx",onChange:r,className:"block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"})]})]})]}),t.jsx("button",{onClick:d,disabled:e,className:"inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",children:e?t.jsxs(t.Fragment,{children:[t.jsx(O,{className:"animate-spin mr-2 h-5 w-5 text-white"}),"Analyzing..."]}):t.jsxs(t.Fragment,{children:[t.jsx(O,{className:"mr-2 h-5 w-5 text-white"}),"Analyze Documents"]})}),i&&t.jsxs("div",{className:"space-y-6",children:[t.jsxs("div",{className:"grid grid-cols-2 gap-6",children:[t.jsx("div",{children:u(i.scopeOfWork)}),t.jsx("div",{children:u(i.technicalRequirements)})]}),t.jsxs("div",{children:[t.jsx("h3",{className:"text-lg font-medium mb-4",children:"Contract Requirements"}),t.jsxs("div",{className:"space-y-6",children:[t.jsxs("div",{className:"bg-white p-6 rounded-lg shadow",children:[t.jsx("h4",{className:"text-base font-medium mb-4",children:"Type of Contract"}),t.jsx("div",{className:"space-y-2",children:i.contractRequirements.typeOfContract.map((o,c)=>t.jsx("p",{className:"text-gray-600",children:o},c))})]}),t.jsxs("div",{className:"bg-white p-6 rounded-lg shadow",children:[t.jsx("h4",{className:"text-base font-medium mb-4",children:"Option Periods"}),t.jsx("div",{className:"space-y-2",children:i.contractRequirements.optionPeriods.map((o,c)=>t.jsx("p",{className:"text-gray-600",children:o},c))})]}),t.jsxs("div",{className:"bg-white p-6 rounded-lg shadow",children:[t.jsx("h4",{className:"text-base font-medium mb-4",children:"Period of Performance"}),t.jsx("div",{className:"space-y-2",children:i.contractRequirements.periodOfPerformance.map((o,c)=>t.jsx("p",{className:"text-gray-600",children:o},c))})]}),t.jsxs("div",{className:"bg-white p-6 rounded-lg shadow",children:[t.jsx("h4",{className:"text-base font-medium mb-4",children:"Place of Performance"}),t.jsx("div",{className:"space-y-2",children:i.contractRequirements.placeOfPerformance.map((o,c)=>t.jsx("p",{className:"text-gray-600",children:o},c))})]})]})]}),t.jsxs("div",{children:[t.jsx("h3",{className:"text-lg font-medium mb-4",children:"Key Terms"}),j(i.keyTerms)]}),t.jsxs("div",{children:[t.jsx("h3",{className:"text-lg font-medium mb-4",children:"Submission Requirements"}),h(i.submissionRequirements)]}),t.jsxs("div",{children:[t.jsx("h3",{className:"text-lg font-medium mb-4",children:"Evaluation Factors"}),u(i.evaluationFactors)]}),t.jsxs("div",{children:[t.jsx("h3",{className:"text-lg font-medium mb-4",children:"Compliance Requirements"}),b(i.complianceRequirements)]})]})]})})})};export{Te as default};
//# sourceMappingURL=SOWAnalyzer.cadb1651.js.map
