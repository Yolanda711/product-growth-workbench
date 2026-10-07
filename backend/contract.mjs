// Shared browser / Worker contract. Only aggregate metrics enter the model.
const ai37Schema={type:'object',additionalProperties:false,required:['summary','hypotheses','evidence','actions'],properties:{summary:{type:'string'},hypotheses:{type:'array',items:{type:'object',additionalProperties:false,required:['title','explanation','metric_ids'],properties:{title:{type:'string'},explanation:{type:'string'},metric_ids:{type:'array',items:{type:'string'}}}}},evidence:{type:'array',items:{type:'object',additionalProperties:false,required:['question','why'],properties:{question:{type:'string'},why:{type:'string'}}}},actions:{type:'array',items:{type:'object',additionalProperties:false,required:['title','action','validation','primary_metric','guardrail','stage'],properties:{title:{type:'string'},action:{type:'string'},validation:{type:'string'},primary_metric:{type:'string'},guardrail:{type:'string'},stage:{type:['integer','null']}}}}}};
function ai37Text(v,max=600){return typeof v==='string'&&v.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)}
function ai37Keys(o,keys){return o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k))}
function ai37ValidateContext(c){
 if(!ai37Keys(c,['schema','page','domain','source','mode','asOf','scope','window','pending','metrics'])||c.schema!==1||!['product','marketing'].includes(c.domain)||!['synthetic','anonymous'].includes(c.mode))throw Error('分析上下文无效');
 for(const k of ['page','source','asOf','window'])if(!ai37Text(c[k],300))throw Error('来源或口径无效');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(c.asOf)||!ai37Keys(c.scope,['market','segment','channel','coupon','product','batch']))throw Error('分析范围无效');
 for(const v of Object.values(c.scope))if(!ai37Text(v,120))throw Error('筛选范围无效');
 if(!Number.isSafeInteger(c.pending)||c.pending<0||!Array.isArray(c.metrics)||c.metrics.length<1||c.metrics.length>16)throw Error('聚合指标无效');
 const seen=new Set();for(const m of c.metrics){if(!ai37Keys(m,['id','label','n','d','stage'])||!ai37Text(m.id,40)||!ai37Text(m.label,100)||seen.has(m.id)||!Number.isSafeInteger(m.n)||!Number.isSafeInteger(m.d)||m.n<0||m.d<0||m.n>m.d||!(m.stage===null||Number.isInteger(m.stage)&&m.stage>=1&&m.stage<=12))throw Error('指标分母或环节无效');seen.add(m.id)}
 return c;
}
function ai37ValidateResult(r,c){
 ai37ValidateContext(c);if(!ai37Keys(r,['summary','hypotheses','evidence','actions'])||!ai37Text(r.summary,1200))throw Error('AI 返回格式无效');const ids=new Set(c.metrics.map(m=>m.id)),stages=new Set(c.metrics.map(m=>m.stage).filter(x=>x!==null));
 for(const k of ['hypotheses','evidence','actions'])if(!Array.isArray(r[k])||r[k].length>6)throw Error('AI 返回条目过多');
 for(const h of r.hypotheses)if(!ai37Keys(h,['title','explanation','metric_ids'])||!ai37Text(h.title,120)||!ai37Text(h.explanation)||!Array.isArray(h.metric_ids)||h.metric_ids.length>6||h.metric_ids.some(id=>!ids.has(id)))throw Error('AI 引用未知指标');
 for(const e of r.evidence)if(!ai37Keys(e,['question','why'])||!ai37Text(e.question,300)||!ai37Text(e.why))throw Error('AI 证据问题无效');
 for(const a of r.actions)if(!ai37Keys(a,['title','action','validation','primary_metric','guardrail','stage'])||!ai37Text(a.title,120)||!ai37Text(a.action)||!ai37Text(a.validation)||!ai37Text(a.guardrail)||!ids.has(a.primary_metric)||!(a.stage===null||stages.has(a.stage))||a.stage!==c.metrics.find(m=>m.id===a.primary_metric)?.stage)throw Error('AI 方案引用无效');
 return r;
}

export { ai37Schema, ai37ValidateContext, ai37ValidateResult };
