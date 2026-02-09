const vocabularyData = [
  // ========== BASIC (基础) ==========
  {
    id: 1,
    word: "abandon",
    phonetic: "/əˈbændən/",
    pos: "v.",
    meaning: "放弃；抛弃",
    level: "basic",
    examples: [
      { en: "He abandoned his plan to travel abroad.", zh: "他放弃了出国旅行的计划。" },
      { en: "The crew abandoned the sinking ship.", zh: "船员们弃船逃生。" }
    ]
  },
  {
    id: 2,
    word: "benefit",
    phonetic: "/ˈbenɪfɪt/",
    pos: "n./v.",
    meaning: "好处；使受益",
    level: "basic",
    examples: [
      { en: "Regular exercise has many health benefits.", zh: "经常锻炼有很多健康益处。" },
      { en: "The new policy will benefit low-income families.", zh: "新政策将使低收入家庭受益。" }
    ]
  },
  {
    id: 3,
    word: "community",
    phonetic: "/kəˈmjuːnəti/",
    pos: "n.",
    meaning: "社区；社会；团体",
    level: "basic",
    examples: [
      { en: "The local community raised funds for the new library.", zh: "当地社区为新图书馆筹集了资金。" }
    ]
  },
  {
    id: 4,
    word: "demonstrate",
    phonetic: "/ˈdemənstreɪt/",
    pos: "v.",
    meaning: "证明；示范；展示",
    level: "basic",
    examples: [
      { en: "The experiment demonstrates the effects of climate change.", zh: "该实验展示了气候变化的影响。" },
      { en: "She demonstrated how to use the equipment.", zh: "她示范了如何使用该设备。" }
    ]
  },
  {
    id: 5,
    word: "environment",
    phonetic: "/ɪnˈvaɪrənmənt/",
    pos: "n.",
    meaning: "环境；自然环境",
    level: "basic",
    examples: [
      { en: "We must take steps to protect the environment.", zh: "我们必须采取措施保护环境。" }
    ]
  },
  {
    id: 6,
    word: "factor",
    phonetic: "/ˈfæktər/",
    pos: "n.",
    meaning: "因素；要素",
    level: "basic",
    examples: [
      { en: "Economic factors play a major role in migration.", zh: "经济因素在人口迁移中起着重要作用。" },
      { en: "There are several factors to consider before making a decision.", zh: "在做决定之前有几个因素需要考虑。" }
    ]
  },
  {
    id: 7,
    word: "generate",
    phonetic: "/ˈdʒenəreɪt/",
    pos: "v.",
    meaning: "产生；引起",
    level: "basic",
    examples: [
      { en: "Wind turbines generate clean energy.", zh: "风力涡轮机产生清洁能源。" }
    ]
  },
  {
    id: 8,
    word: "identify",
    phonetic: "/aɪˈdentɪfaɪ/",
    pos: "v.",
    meaning: "识别；确认；鉴定",
    level: "basic",
    examples: [
      { en: "Scientists have identified a new species of bird.", zh: "科学家们鉴定了一种新的鸟类。" },
      { en: "Can you identify the main argument of the passage?", zh: "你能找出这篇文章的主要论点吗？" }
    ]
  },
  {
    id: 9,
    word: "significant",
    phonetic: "/sɪɡˈnɪfɪkənt/",
    pos: "adj.",
    meaning: "重要的；显著的",
    level: "basic",
    examples: [
      { en: "There has been a significant increase in population.", zh: "人口有了显著的增长。" }
    ]
  },
  {
    id: 10,
    word: "approach",
    phonetic: "/əˈprəʊtʃ/",
    pos: "n./v.",
    meaning: "方法；接近",
    level: "basic",
    examples: [
      { en: "We need a new approach to solve this problem.", zh: "我们需要一种新方法来解决这个问题。" },
      { en: "Winter is approaching fast.", zh: "冬天正在快速到来。" }
    ]
  },
  {
    id: 11,
    word: "available",
    phonetic: "/əˈveɪləbl/",
    pos: "adj.",
    meaning: "可获得的；可用的",
    level: "basic",
    examples: [
      { en: "Fresh water is not always available in arid regions.", zh: "在干旱地区并非总能获得淡水。" }
    ]
  },
  {
    id: 12,
    word: "indicate",
    phonetic: "/ˈɪndɪkeɪt/",
    pos: "v.",
    meaning: "表明；指示",
    level: "basic",
    examples: [
      { en: "Research indicates that diet affects mental health.", zh: "研究表明饮食会影响心理健康。" },
      { en: "The arrow indicates the direction of flow.", zh: "箭头指示了流动的方向。" }
    ]
  },
  {
    id: 13,
    word: "individual",
    phonetic: "/ˌɪndɪˈvɪdʒuəl/",
    pos: "n./adj.",
    meaning: "个人；个人的",
    level: "basic",
    examples: [
      { en: "Each individual has the right to education.", zh: "每个人都有受教育的权利。" }
    ]
  },
  {
    id: 14,
    word: "involve",
    phonetic: "/ɪnˈvɒlv/",
    pos: "v.",
    meaning: "涉及；包含；牵涉",
    level: "basic",
    examples: [
      { en: "The project involves collaboration between several departments.", zh: "该项目涉及多个部门之间的合作。" }
    ]
  },
  {
    id: 15,
    word: "maintain",
    phonetic: "/meɪnˈteɪn/",
    pos: "v.",
    meaning: "维持；保持；维修",
    level: "basic",
    examples: [
      { en: "It is important to maintain a balanced diet.", zh: "保持均衡饮食很重要。" },
      { en: "The building is expensive to maintain.", zh: "这栋建筑的维护成本很高。" }
    ]
  },
  {
    id: 16,
    word: "obvious",
    phonetic: "/ˈɒbviəs/",
    pos: "adj.",
    meaning: "明显的；显而易见的",
    level: "basic",
    examples: [
      { en: "The advantages of public transport are obvious.", zh: "公共交通的优势是显而易见的。" }
    ]
  },
  {
    id: 17,
    word: "occur",
    phonetic: "/əˈkɜːr/",
    pos: "v.",
    meaning: "发生；出现",
    level: "basic",
    examples: [
      { en: "Earthquakes occur frequently in this region.", zh: "这个地区经常发生地震。" }
    ]
  },
  {
    id: 18,
    word: "provide",
    phonetic: "/prəˈvaɪd/",
    pos: "v.",
    meaning: "提供；供给",
    level: "basic",
    examples: [
      { en: "The government provides free healthcare for children.", zh: "政府为儿童提供免费医疗。" },
      { en: "Trees provide shade and oxygen.", zh: "树木提供阴凉和氧气。" }
    ]
  },
  {
    id: 19,
    word: "require",
    phonetic: "/rɪˈkwaɪər/",
    pos: "v.",
    meaning: "需要；要求",
    level: "basic",
    examples: [
      { en: "This job requires excellent communication skills.", zh: "这份工作需要出色的沟通能力。" }
    ]
  },
  {
    id: 20,
    word: "strategy",
    phonetic: "/ˈstrætədʒi/",
    pos: "n.",
    meaning: "策略；战略",
    level: "basic",
    examples: [
      { en: "The company developed a new marketing strategy.", zh: "公司制定了新的营销策略。" },
      { en: "Having a clear strategy is essential for success.", zh: "拥有清晰的策略对于成功至关重要。" }
    ]
  },
  {
    id: 21,
    word: "adequate",
    phonetic: "/ˈædɪkwət/",
    pos: "adj.",
    meaning: "充足的；适当的",
    level: "basic",
    examples: [
      { en: "Many schools lack adequate funding.", zh: "许多学校缺乏足够的资金。" }
    ]
  },
  {
    id: 22,
    word: "estimate",
    phonetic: "/ˈestɪmeɪt/",
    pos: "v./n.",
    meaning: "估计；估算",
    level: "basic",
    examples: [
      { en: "It is estimated that the population will reach 10 billion by 2050.", zh: "据估计，到2050年人口将达到100亿。" }
    ]
  },

  // ========== INTERMEDIATE (进阶) ==========
  {
    id: 23,
    word: "accumulate",
    phonetic: "/əˈkjuːmjəleɪt/",
    pos: "v.",
    meaning: "积累；积聚",
    level: "intermediate",
    examples: [
      { en: "Wealth tends to accumulate over generations.", zh: "财富往往经过几代人的积累。" },
      { en: "Dust had accumulated on the shelves.", zh: "架子上已经积了灰尘。" }
    ]
  },
  {
    id: 24,
    word: "controversial",
    phonetic: "/ˌkɒntrəˈvɜːʃəl/",
    pos: "adj.",
    meaning: "有争议的",
    level: "intermediate",
    examples: [
      { en: "Genetic modification remains a controversial topic.", zh: "基因改造仍然是一个有争议的话题。" }
    ]
  },
  {
    id: 25,
    word: "deteriorate",
    phonetic: "/dɪˈtɪəriəreɪt/",
    pos: "v.",
    meaning: "恶化；变坏",
    level: "intermediate",
    examples: [
      { en: "Air quality has deteriorated significantly in recent years.", zh: "近年来空气质量明显恶化。" },
      { en: "His health began to deteriorate rapidly.", zh: "他的健康状况开始迅速恶化。" }
    ]
  },
  {
    id: 26,
    word: "elaborate",
    phonetic: "/ɪˈlæbərət/",
    pos: "adj./v.",
    meaning: "精心制作的；详细阐述",
    level: "intermediate",
    examples: [
      { en: "Could you elaborate on your previous point?", zh: "你能详细阐述一下你之前的观点吗？" },
      { en: "They made elaborate preparations for the ceremony.", zh: "他们为仪式做了精心的准备。" }
    ]
  },
  {
    id: 27,
    word: "fluctuate",
    phonetic: "/ˈflʌktʃueɪt/",
    pos: "v.",
    meaning: "波动；起伏",
    level: "intermediate",
    examples: [
      { en: "Oil prices fluctuate according to global demand.", zh: "石油价格随全球需求波动。" }
    ]
  },
  {
    id: 28,
    word: "implement",
    phonetic: "/ˈɪmplɪment/",
    pos: "v.",
    meaning: "实施；执行",
    level: "intermediate",
    examples: [
      { en: "The government plans to implement new environmental regulations.", zh: "政府计划实施新的环境法规。" }
    ]
  },
  {
    id: 29,
    word: "inevitable",
    phonetic: "/ɪnˈevɪtəbl/",
    pos: "adj.",
    meaning: "不可避免的",
    level: "intermediate",
    examples: [
      { en: "Change is inevitable in a rapidly developing society.", zh: "在快速发展的社会中，变化是不可避免的。" }
    ]
  },
  {
    id: 30,
    word: "justify",
    phonetic: "/ˈdʒʌstɪfaɪ/",
    pos: "v.",
    meaning: "证明……有道理；为……辩护",
    level: "intermediate",
    examples: [
      { en: "How can you justify spending so much money on defence?", zh: "你怎么能为在国防上花这么多钱找理由呢？" },
      { en: "The results justify the investment.", zh: "结果证明这项投资是合理的。" }
    ]
  },
  {
    id: 31,
    word: "predominantly",
    phonetic: "/prɪˈdɒmɪnəntli/",
    pos: "adv.",
    meaning: "主要地；占主导地位地",
    level: "intermediate",
    examples: [
      { en: "The workforce is predominantly female.", zh: "劳动力以女性为主。" }
    ]
  },
  {
    id: 32,
    word: "reluctant",
    phonetic: "/rɪˈlʌktənt/",
    pos: "adj.",
    meaning: "不情愿的；勉强的",
    level: "intermediate",
    examples: [
      { en: "Many companies are reluctant to invest in renewable energy.", zh: "许多公司不愿投资可再生能源。" }
    ]
  },
  {
    id: 33,
    word: "substantial",
    phonetic: "/səbˈstænʃəl/",
    pos: "adj.",
    meaning: "大量的；重大的",
    level: "intermediate",
    examples: [
      { en: "There has been a substantial rise in unemployment.", zh: "失业率有了大幅上升。" },
      { en: "The project requires a substantial amount of funding.", zh: "该项目需要大量资金。" }
    ]
  },
  {
    id: 34,
    word: "enhance",
    phonetic: "/ɪnˈhɑːns/",
    pos: "v.",
    meaning: "增强；提高；改善",
    level: "intermediate",
    examples: [
      { en: "Technology can enhance the learning experience.", zh: "技术可以提升学习体验。" }
    ]
  },
  {
    id: 35,
    word: "phenomenon",
    phonetic: "/fəˈnɒmɪnən/",
    pos: "n.",
    meaning: "现象",
    level: "intermediate",
    examples: [
      { en: "Global warming is a well-documented phenomenon.", zh: "全球变暖是一个有据可查的现象。" },
      { en: "The phenomenon of urbanisation affects many developing countries.", zh: "城市化现象影响着许多发展中国家。" }
    ]
  },
  {
    id: 36,
    word: "perspective",
    phonetic: "/pəˈspektɪv/",
    pos: "n.",
    meaning: "观点；角度；视角",
    level: "intermediate",
    examples: [
      { en: "It is important to consider the issue from different perspectives.", zh: "从不同角度考虑这个问题很重要。" }
    ]
  },
  {
    id: 37,
    word: "contribute",
    phonetic: "/kənˈtrɪbjuːt/",
    pos: "v.",
    meaning: "贡献；促成；捐献",
    level: "intermediate",
    examples: [
      { en: "Many factors contribute to climate change.", zh: "许多因素促成了气候变化。" },
      { en: "She contributed a large sum to charity.", zh: "她向慈善机构捐了一大笔钱。" }
    ]
  },
  {
    id: 38,
    word: "diminish",
    phonetic: "/dɪˈmɪnɪʃ/",
    pos: "v.",
    meaning: "减少；缩小；降低",
    level: "intermediate",
    examples: [
      { en: "The supply of fresh water is diminishing rapidly.", zh: "淡水供应正在迅速减少。" }
    ]
  },
  {
    id: 39,
    word: "constitute",
    phonetic: "/ˈkɒnstɪtjuːt/",
    pos: "v.",
    meaning: "构成；组成",
    level: "intermediate",
    examples: [
      { en: "Women constitute over 50% of the population.", zh: "女性占人口的50%以上。" }
    ]
  },
  {
    id: 40,
    word: "compensate",
    phonetic: "/ˈkɒmpenseɪt/",
    pos: "v.",
    meaning: "补偿；弥补；赔偿",
    level: "intermediate",
    examples: [
      { en: "Nothing can compensate for the loss of a loved one.", zh: "没有什么能弥补失去亲人的痛苦。" },
      { en: "The company compensated workers for overtime.", zh: "公司对工人的加班进行了补偿。" }
    ]
  },
  {
    id: 41,
    word: "undergo",
    phonetic: "/ˌʌndəˈɡəʊ/",
    pos: "v.",
    meaning: "经历；经受",
    level: "intermediate",
    examples: [
      { en: "The city has undergone dramatic changes in the last decade.", zh: "这座城市在过去十年中经历了巨大的变化。" }
    ]
  },
  {
    id: 42,
    word: "constraint",
    phonetic: "/kənˈstreɪnt/",
    pos: "n.",
    meaning: "限制；约束",
    level: "intermediate",
    examples: [
      { en: "Budget constraints forced the team to reduce staff.", zh: "预算限制迫使团队裁员。" },
      { en: "Time constraints prevented a thorough investigation.", zh: "时间限制阻碍了彻底的调查。" }
    ]
  },
  {
    id: 43,
    word: "comprehensive",
    phonetic: "/ˌkɒmprɪˈhensɪv/",
    pos: "adj.",
    meaning: "全面的；综合的",
    level: "intermediate",
    examples: [
      { en: "The report provides a comprehensive analysis of the data.", zh: "该报告对数据进行了全面的分析。" }
    ]
  },
  {
    id: 44,
    word: "implication",
    phonetic: "/ˌɪmplɪˈkeɪʃən/",
    pos: "n.",
    meaning: "含义；影响；暗示",
    level: "intermediate",
    examples: [
      { en: "The findings have important implications for public health policy.", zh: "这些发现对公共卫生政策有重要影响。" }
    ]
  },

  // ========== ADVANCED (高频) ==========
  {
    id: 45,
    word: "exacerbate",
    phonetic: "/ɪɡˈzæsəbeɪt/",
    pos: "v.",
    meaning: "使恶化；使加剧",
    level: "advanced",
    examples: [
      { en: "Pollution exacerbates respiratory diseases.", zh: "污染加剧了呼吸系统疾病。" },
      { en: "The drought was exacerbated by deforestation.", zh: "森林砍伐加剧了干旱。" }
    ]
  },
  {
    id: 46,
    word: "unprecedented",
    phonetic: "/ʌnˈpresɪdentɪd/",
    pos: "adj.",
    meaning: "前所未有的；空前的",
    level: "advanced",
    examples: [
      { en: "The country is facing an unprecedented economic crisis.", zh: "这个国家正面临前所未有的经济危机。" }
    ]
  },
  {
    id: 47,
    word: "paradox",
    phonetic: "/ˈpærədɒks/",
    pos: "n.",
    meaning: "悖论；矛盾的事物",
    level: "advanced",
    examples: [
      { en: "It is a paradox that wealth does not always bring happiness.", zh: "财富并不总是带来幸福，这是一个悖论。" }
    ]
  },
  {
    id: 48,
    word: "pragmatic",
    phonetic: "/præɡˈmætɪk/",
    pos: "adj.",
    meaning: "务实的；实用主义的",
    level: "advanced",
    examples: [
      { en: "The government took a pragmatic approach to reform.", zh: "政府采取了务实的改革方法。" },
      { en: "We need pragmatic solutions, not idealistic theories.", zh: "我们需要务实的解决方案，而不是理想化的理论。" }
    ]
  },
  {
    id: 49,
    word: "scrutiny",
    phonetic: "/ˈskruːtəni/",
    pos: "n.",
    meaning: "审查；仔细检查",
    level: "advanced",
    examples: [
      { en: "The proposal came under close scrutiny from regulators.", zh: "该提案受到了监管机构的严格审查。" }
    ]
  },
  {
    id: 50,
    word: "mitigate",
    phonetic: "/ˈmɪtɪɡeɪt/",
    pos: "v.",
    meaning: "减轻；缓和",
    level: "advanced",
    examples: [
      { en: "Planting trees can help mitigate the effects of global warming.", zh: "植树可以帮助减轻全球变暖的影响。" },
      { en: "Measures were taken to mitigate the risk of flooding.", zh: "已采取措施减轻洪水风险。" }
    ]
  },
  {
    id: 51,
    word: "proliferation",
    phonetic: "/prəˌlɪfəˈreɪʃən/",
    pos: "n.",
    meaning: "激增；扩散",
    level: "advanced",
    examples: [
      { en: "The proliferation of social media has transformed communication.", zh: "社交媒体的激增改变了人们的交流方式。" }
    ]
  },
  {
    id: 52,
    word: "catalyst",
    phonetic: "/ˈkætəlɪst/",
    pos: "n.",
    meaning: "催化剂；促进因素",
    level: "advanced",
    examples: [
      { en: "The invention of the internet was a catalyst for globalisation.", zh: "互联网的发明是全球化的催化剂。" }
    ]
  },
  {
    id: 53,
    word: "discrepancy",
    phonetic: "/dɪsˈkrepənsi/",
    pos: "n.",
    meaning: "差异；不一致",
    level: "advanced",
    examples: [
      { en: "There is a discrepancy between the two sets of data.", zh: "两组数据之间存在差异。" },
      { en: "Discrepancies in income levels remain a pressing issue.", zh: "收入水平的差异仍然是一个紧迫的问题。" }
    ]
  },
  {
    id: 54,
    word: "ubiquitous",
    phonetic: "/juːˈbɪkwɪtəs/",
    pos: "adj.",
    meaning: "无处不在的；普遍存在的",
    level: "advanced",
    examples: [
      { en: "Smartphones have become ubiquitous in modern society.", zh: "智能手机在现代社会已经无处不在。" }
    ]
  },
  {
    id: 55,
    word: "detrimental",
    phonetic: "/ˌdetrɪˈmentl/",
    pos: "adj.",
    meaning: "有害的；不利的",
    level: "advanced",
    examples: [
      { en: "Smoking is detrimental to health.", zh: "吸烟有害健康。" },
      { en: "Excessive screen time can be detrimental to children's development.", zh: "过多的屏幕时间可能不利于儿童的发育。" }
    ]
  },
  {
    id: 56,
    word: "autonomous",
    phonetic: "/ɔːˈtɒnəməs/",
    pos: "adj.",
    meaning: "自治的；自主的",
    level: "advanced",
    examples: [
      { en: "Autonomous vehicles are expected to revolutionise transport.", zh: "自动驾驶汽车预计将彻底改变交通。" }
    ]
  },
  {
    id: 57,
    word: "corroborate",
    phonetic: "/kəˈrɒbəreɪt/",
    pos: "v.",
    meaning: "证实；支持",
    level: "advanced",
    examples: [
      { en: "The witness's testimony corroborated the evidence.", zh: "证人的证词证实了这些证据。" }
    ]
  },
  {
    id: 58,
    word: "alleviate",
    phonetic: "/əˈliːvieɪt/",
    pos: "v.",
    meaning: "减轻；缓解",
    level: "advanced",
    examples: [
      { en: "The charity works to alleviate poverty in developing nations.", zh: "该慈善机构致力于减轻发展中国家的贫困。" },
      { en: "Medication can help alleviate the symptoms.", zh: "药物可以帮助缓解症状。" }
    ]
  },
  {
    id: 59,
    word: "superficial",
    phonetic: "/ˌsuːpəˈfɪʃəl/",
    pos: "adj.",
    meaning: "肤浅的；表面的",
    level: "advanced",
    examples: [
      { en: "The analysis was too superficial to be of any real value.", zh: "这个分析太肤浅了，没有什么实际价值。" }
    ]
  },
  {
    id: 60,
    word: "reconcile",
    phonetic: "/ˈrekənsaɪl/",
    pos: "v.",
    meaning: "调和；使一致；和解",
    level: "advanced",
    examples: [
      { en: "It is difficult to reconcile economic growth with environmental protection.", zh: "很难在经济增长与环境保护之间取得平衡。" }
    ]
  },
  {
    id: 61,
    word: "hypothetical",
    phonetic: "/ˌhaɪpəˈθetɪkəl/",
    pos: "adj.",
    meaning: "假设的；假定的",
    level: "advanced",
    examples: [
      { en: "Let us consider a hypothetical situation.", zh: "让我们考虑一种假设的情况。" },
      { en: "The benefits are not just hypothetical; they have been proven.", zh: "这些好处不仅仅是假设的，它们已经被证实了。" }
    ]
  },
  {
    id: 62,
    word: "indigenous",
    phonetic: "/ɪnˈdɪdʒənəs/",
    pos: "adj.",
    meaning: "本土的；土著的",
    level: "advanced",
    examples: [
      { en: "The rights of indigenous peoples must be respected.", zh: "必须尊重土著人民的权利。" }
    ]
  },
  {
    id: 63,
    word: "pertinent",
    phonetic: "/ˈpɜːtɪnənt/",
    pos: "adj.",
    meaning: "相关的；切题的",
    level: "advanced",
    examples: [
      { en: "Please keep your comments pertinent to the discussion.", zh: "请让你的评论与讨论相关。" }
    ]
  },
  {
    id: 64,
    word: "undermine",
    phonetic: "/ˌʌndəˈmaɪn/",
    pos: "v.",
    meaning: "削弱；损害；破坏",
    level: "advanced",
    examples: [
      { en: "Corruption undermines public trust in the government.", zh: "腐败削弱了公众对政府的信任。" },
      { en: "His constant criticism undermined her confidence.", zh: "他不断的批评削弱了她的信心。" }
    ]
  },
  {
    id: 65,
    word: "nostalgia",
    phonetic: "/nɒˈstældʒə/",
    pos: "n.",
    meaning: "怀旧；乡愁",
    level: "advanced",
    examples: [
      { en: "There is a growing nostalgia for traditional ways of life.", zh: "人们对传统生活方式越来越怀念。" }
    ]
  },
  {
    id: 66,
    word: "ambiguous",
    phonetic: "/æmˈbɪɡjuəs/",
    pos: "adj.",
    meaning: "模糊的；含糊不清的",
    level: "advanced",
    examples: [
      { en: "The law is ambiguous and open to different interpretations.", zh: "这项法律含糊不清，可以有不同的解读。" },
      { en: "His answer was deliberately ambiguous.", zh: "他的回答故意含糊其辞。" }
    ]
  }
];

export default vocabularyData;
