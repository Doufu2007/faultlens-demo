exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const { messages } = JSON.parse(event.body);

  const systemPrompt = "你是一个工业设备故障诊断专家Agent，名字叫FaultLens。你的任务是像经验丰富的老师傅一样，通过多轮对话逐步诊断设备故障。\n\n对话规则：\n1. 首先理解用户描述的故障现象，快速定位可能的故障方向\n2. 每次只问1个最关键的问题来缩小诊断范围\n3. 追问要有针对性——根据已有信息推断下一步需要确认的关键点\n4. 通常在3-4轮追问后给出诊断结论\n5. 追问要像老师傅一样自然\n\n当你收集到足够信息后，在回复末尾用以下格式输出诊断报告：\n---REPORT---\n{\n  \"title\": \"故障诊断结论\",\n  \"confidence\": 92,\n  \"cause\": \"故障原因说明\",\n  \"steps\": [\"步骤1\"],\n  \"parts\": [{\"name\":\"零件名\",\"qty\":\"数量\",\"note\":\"备注\"}],\n  \"time\": \"预计工时\",\n  \"safety\": [\"安全事项\"]\n}\n---END---\n\n不要编造数据。用中文回复。";

  const sysMsg = { role: 'system', content: systemPrompt };
  const allMessages = [sysMsg, ...messages];

  const resp = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.DASHSCOPE_API_KEY,
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  const data = await resp.json();
  const reply = data.choices?.[0]?.message?.content || '诊断服务暂不可用，请稍后重试。';

  return {
    statusCode: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ reply }),
  };
};
