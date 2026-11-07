/** Preserve confirmed user edits when a canvas is analyzed again.
 * If the canvas changed, retain edits but require a fresh review.
 */
export function reconcileDraft(previous,generated,canvasChanged=false) {
 const prior=new Map((Array.isArray(previous)?previous:[]).map(t=>[t.sourceId||t.id,t]));
 const ids=new Set(generated.map(t=>t.id));
 return generated.map(task=>{
  const old=prior.get(task.sourceId||task.id);
  if(!old||old.confirmed!==true)return {...task,confirmed:false};
  const originalDeps=Array.isArray(old.dependsOn)?old.dependsOn:[];
  const deps=originalDeps.filter(id=>ids.has(id)&&id!==task.id);
  const removedDependency=deps.length!==originalDeps.length;
  const needsReview=Boolean(task.needsReview)||canvasChanged||removedDependency;
  const reasons=[task.reason];
  if(canvasChanged)reasons.push('キャンバス変更後の手修正を保持しました。要再確認');
  if(removedDependency)reasons.push('削除された先行工程を解除しました');
  return {...task,title:old.title,duration:old.duration,startDate:old.startDate||'',dependsOn:deps,
   confirmed:!needsReview,needsReview,reason:reasons.filter(Boolean).join(' / ')};
 });
}
