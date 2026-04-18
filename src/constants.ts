import { Question, Part2CueCard } from './types';

export const PART_1_TOPICS = [
  {
    name: 'Hometown',
    questions: [
      {
        text: 'Where is your hometown?',
        sampleAnswer: 'I was born and raised in [[Hanoi]], which is the capital of Vietnam. It\'s a pretty [[vibrant city]] with a mix of [[modern buildings]] and [[ancient temples]].',
        tips: 'Trả lời trực tiếp nơi bạn sinh ra. Không cần dùng từ đệm "suy nghĩ" cho thông tin cá nhân cơ bản.'
      },
      {
        text: 'What do you like most about your hometown?',
        sampleAnswer: 'I\'d say it\'s definitely the [[street food]]. You can find [[delicious snacks]] on almost every corner, and the atmosphere in the Old Quarter is [[truly unique]].',
        tips: 'Sử dụng "I\'d say" để bắt đầu đưa ra ý kiến một cách tự nhiên.'
      }
    ]
  },
  {
    name: 'Work or Study',
    questions: [
      {
        text: 'Do you work or are you a student?',
        sampleAnswer: 'Currently, I\'m a [[student]] at university. I\'m [[majoring in]] Economics, and I\'m in my [[final year]] now.',
        tips: 'Sử dụng "Currently" hoặc "Right now" để bắt đầu một cách tự nhiên.'
      },
      {
        text: 'Why did you choose that subject?',
        sampleAnswer: 'Well, to be honest, I\'ve always been [[fascinated by]] how the global economy works. Plus, I think it\'ll [[open up]] many [[career opportunities]] for me in the future.',
        tips: 'Dùng "to be honest" khi giải thích lý do hoặc sở thích cá nhân.'
      }
    ]
  },
  {
    name: 'Hobbies',
    questions: [
      {
        text: 'What do you like to do in your free time?',
        sampleAnswer: 'In my spare time, I usually [[hang out]] with my friends or just [[relax at home]] watching a movie. It\'s a [[great way]] to [[unwind]] after a busy day.',
        tips: 'Dùng "hang out" thay cho "go out" để nghe tự nhiên hơn.'
      },
      {
        text: 'Did you have the same hobbies when you were a child?',
        sampleAnswer: 'Not really. When I was younger, I used to [[play outside]] all day, but now I prefer more [[indoor activities]] like reading or gaming.',
        tips: 'Dùng "Not really" để phủ định một cách nhẹ nhàng và tự nhiên.'
      }
    ]
  },
  {
    name: 'Food',
    questions: [
      {
        text: 'What kind of food do you like to eat?',
        sampleAnswer: 'I\'m a [[big fan of]] traditional Vietnamese food, especially Pho. I find it [[really comforting]], especially when it\'s cold outside.',
        tips: 'Cụm "big fan of" rất phổ biến trong văn nói để chỉ sở thích.'
      },
      {
        text: 'Do you prefer eating at home or at a restaurant?',
        sampleAnswer: 'It depends, really. I like [[home-cooked meals]] because they\'re healthy, but [[eating out]] is much more [[convenient]] when I\'m busy.',
        tips: 'Dùng "It depends, really" khi có nhiều phương án lựa chọn.'
      }
    ]
  },
  {
    name: 'Weather',
    questions: [
      {
        text: 'What\'s the weather like in your country?',
        sampleAnswer: 'It varies a lot depending on the region. In the North, we have [[four distinct seasons]], while in the South, it\'s [[sunny and humid]] most of the year.',
        tips: 'Dùng "It varies a lot" để mô tả sự đa dạng.'
      },
      {
        text: 'What\'s your favorite type of weather?',
        sampleAnswer: 'I\'d say I prefer [[cool and breezy]] weather, like in autumn. It\'s the perfect time to [[go for a walk]] or have a picnic.',
        tips: 'Mô tả ngắn gọn cảm giác và hoạt động đi kèm.'
      }
    ]
  },
  {
    name: 'Travel & Holiday',
    questions: [
      {
        text: 'Do you like traveling?',
        sampleAnswer: 'Absolutely! I love [[exploring new places]] and learning about different cultures. It really [[broadens my horizons]].',
        tips: 'Sử dụng "Absolutely!" để thể hiện sự hào hứng.'
      },
      {
        text: 'What was your last holiday like?',
        sampleAnswer: 'It was [[fantastic]]. I went to Da Lat with my family, and we spent most of our time [[sightseeing]] and enjoying the [[chilly weather]].',
        tips: 'Dùng các tính từ tích cực như "fantastic", "amazing".'
      }
    ]
  },
  {
    name: 'Technology',
    questions: [
      {
        text: 'How often do you use the internet?',
        sampleAnswer: 'I use it [[on a daily basis]]. Honestly, I can\'t imagine my life without it since I use it for [[work, study, and entertainment]].',
        tips: 'Cụm "on a daily basis" tự nhiên hơn "every day".'
      },
      {
        text: 'Do you think technology has changed your life?',
        sampleAnswer: 'Definitely. It\'s made communication [[so much faster]] and [[information]] much more [[accessible]] than before.',
        tips: 'Sử dụng "Definitely" để khẳng định mạnh mẽ.'
      }
    ]
  },
  {
    name: 'Family & Friends',
    questions: [
      {
        text: 'Do you spend much time with your family?',
        sampleAnswer: 'I try to spend as much time as possible, especially during weekends. We usually [[have dinner together]] and [[catch up]] on each other\'s lives.',
        tips: 'Cụm "catch up" dùng để nói về việc cập nhật tin tức của nhau.'
      },
      {
        text: 'Who are you closer to, your family or your friends?',
        sampleAnswer: 'That\'s a [[tough one]]. I love my family dearly, but I often [[share my secrets]] with my close friends because we are of the [[same age]].',
        tips: 'Cụm "That\'s a tough one" dùng khi câu hỏi khó chọn lựa.'
      }
    ]
  },
  {
    name: 'Books',
    questions: [
      {
        text: 'Do you enjoy reading books?',
        sampleAnswer: 'Yes, I\'m quite [[into reading]]. I find it a [[great way]] to [[expand my knowledge]] and relax after a long day.',
        tips: 'Cụm "into something" nghĩa là rất thích điều gì đó.'
      },
      {
        text: 'What kind of books do you like?',
        sampleAnswer: 'I\'m mostly into [[self-help books]] or mystery novels. I love trying to [[solve the puzzles]] along with the characters.',
        tips: 'Nêu rõ thể loại bạn yêu thích.'
      }
    ]
  },
  {
    name: 'Environment',
    questions: [
      {
        text: 'Are you concerned about the environment?',
        sampleAnswer: 'Yes, I\'m [[quite worried]] about issues like [[pollution and global warming]]. I think we all need to [[do our part]] to protect the planet.',
        tips: 'Cụm "do our part" nghĩa là đóng góp phần trách nhiệm của mình.'
      },
      {
        text: 'What do you do to protect the environment?',
        sampleAnswer: 'I try to [[reduce my plastic use]] and always [[recycle]] whenever I can. I also prefer using [[public transportation]] to lower my carbon footprint.',
        tips: 'Liệt kê các hành động cụ thể và đơn giản.'
      }
    ]
  },
  {
    name: 'Education',
    questions: [
      {
        text: 'Do you think education is important?',
        sampleAnswer: 'Absolutely. It provides us with [[knowledge and skills]] that are essential for our [[future careers]] and personal growth.',
        tips: 'Nhấn mạnh vai trò của giáo dục.'
      }
    ]
  },
  {
    name: 'Accommodation',
    questions: [
      {
        text: 'Do you live in a house or an apartment?',
        sampleAnswer: 'I live in a [[cozy apartment]] in the city center. It\'s not very big, but it\'s [[conveniently located]] near my work.',
        tips: 'Mô tả ngắn gọn về nơi ở.'
      }
    ]
  },
  {
    name: 'Sports & Exercise',
    questions: [
      {
        text: 'Do you like playing sports?',
        sampleAnswer: 'I enjoy [[playing badminton]] with my friends on weekends. It\'s a good way to [[stay fit]] and have fun at the same time.',
        tips: 'Nêu một môn thể thao cụ thể.'
      }
    ]
  },
  {
    name: 'Health',
    questions: [
      {
        text: 'How do you keep yourself healthy?',
        sampleAnswer: 'I try to [[eat a balanced diet]] and go for a [[jog]] every morning. I also make sure to get [[enough sleep]] every night.',
        tips: 'Liệt kê các thói quen lành mạnh.'
      }
    ]
  },
  {
    name: 'Media/ Social Network',
    questions: [
      {
        text: 'Which social media platforms do you use?',
        sampleAnswer: 'I mostly use [[Facebook and Instagram]] to [[stay connected]] with my friends and see what\'s happening in the world.',
        tips: 'Nêu các nền tảng phổ biến.'
      }
    ]
  },
  {
    name: 'Music',
    questions: [
      {
        text: 'What kind of music do you like?',
        sampleAnswer: 'I\'m a big fan of [[Pop music]]. It\'s very [[catchy]] and always puts me in a [[good mood]].',
        tips: 'Dùng "catchy" để tả nhạc dễ nghe, dễ nhớ.'
      }
    ]
  },
  {
    name: 'Shopping',
    questions: [
      {
        text: 'Do you enjoy shopping?',
        sampleAnswer: 'Actually, I\'m not a [[big shopper]]. I only go when I [[really need]] something, as I find crowded malls quite [[tiring]].',
        tips: 'Trả lời thật lòng về sở thích cá nhân.'
      }
    ]
  },
  {
    name: 'Leisure Time',
    questions: [
      {
        text: 'What do you do when you have a day off?',
        sampleAnswer: 'I usually like to [[sleep in]] a bit and then spend the afternoon at a [[local cafe]] reading or chatting with friends.',
        tips: 'Cụm "sleep in" nghĩa là ngủ nướng.'
      }
    ]
  },
  {
    name: 'Transportation',
    questions: [
      {
        text: 'What\'s the most popular means of transport in your city?',
        sampleAnswer: 'Definitely [[motorbikes]]. They are everywhere because they\'re [[quick and easy]] to navigate through the [[traffic jams]].',
        tips: 'Nêu thực tế tại nơi bạn sống.'
      }
    ]
  },
  {
    name: 'Job',
    questions: [
      {
        text: 'What kind of job would you like to have in the future?',
        sampleAnswer: 'I\'d love to work as a [[Marketing Manager]]. I enjoy being [[creative]] and coming up with [[new ideas]] to promote products.',
        tips: 'Nói về đam mê hoặc mục tiêu nghề nghiệp.'
      }
    ]
  },
  {
    name: 'Art',
    questions: [
      {
        text: 'Are you interested in art?',
        sampleAnswer: 'To be honest, I\'m not very [[artistic]], but I do enjoy going to [[art galleries]] once in a while to see the [[creative works]].',
        tips: 'Thừa nhận nếu bạn không có khiếu nhưng vẫn có sở thích xem.'
      }
    ]
  },
  {
    name: 'Language',
    questions: [
      {
        text: 'What languages can you speak?',
        sampleAnswer: 'I speak [[Vietnamese]] as my mother tongue and I\'m currently [[learning English]] to broaden my [[career prospects]].',
        tips: 'Trả lời trực tiếp và nêu mục đích học tập.'
      }
    ]
  },
  {
    name: 'Famous People',
    questions: [
      {
        text: 'Who is a famous person you admire?',
        sampleAnswer: 'I really admire [[Bill Gates]] for his [[philanthropy]] and how he\'s used his wealth to help people around the world.',
        tips: 'Nêu tên và lý do ngắn gọn.'
      }
    ]
  },
  {
    name: 'Advertisement',
    questions: [
      {
        text: 'Do you like watching advertisements?',
        sampleAnswer: 'Not really, I find them quite [[annoying]] when they pop up in the middle of a video. However, some [[creative ads]] can be quite interesting.',
        tips: 'Nêu cả điểm trừ và điểm cộng nếu có.'
      }
    ]
  }
];

export const PART_2_CUE_CARDS: Part2CueCard[] = [
  {
    id: 'p2_1',
    part: 2,
    topic: 'Describe a person',
    text: 'Describe a person you admire.',
    prompts: [
      'Who this person is',
      'How you know this person',
      'What they are like',
      'And explain why you admire them.'
    ],
    framework: '1. Intro: Name the person.\n2. Context: How/When you met + personality description.\n3. Story: A time they helped you or achieved something (Past -> Climax -> Result -> Present).\n4. Conclusion: Future wishes or final feeling.',
    sampleAnswer: 'Well, today I\'d like to talk about my high school teacher, Mr. Nam. He was tall and slim, and was [[very supportive]] and friendly to students. You know, I first met him when I was a [[struggling tenth grader]] who couldn\'t understand basic math.\n\nBasically, at that time, I was [[almost failing]] the subject because I didn\'t get almost anything about maths. However, Mr. Nam [[spent extra hours]] explaining concepts using [[real-world examples]]. Eventually, I not only passed but [[became top of my class]]. Today, I\'m [[pursuing an engineering degree]] thanks to him.\n\nWhat I\'m trying to say is, through this experience, I feel [[very grateful]] and I really hope I can visit him soon to show my gratitude.',
    tips: 'Part 2 yêu cầu một bài nói dài. Hãy sử dụng Framework để giữ cho câu chuyện của bạn có tổ chức.'
  }
];

export const PART_3_QUESTIONS: { [cueCardId: string]: { id: string, text: string, sampleAnswer: string, tips: string }[] } = {
  p2_1: [
    {
      id: 'p3_1_1',
      text: 'Do you think successful people are usually good role models?',
      sampleAnswer: 'I\'d say it depends on how they [[attained their success]]. While many people [[achieve success]] through [[hard work and integrity]], others might take shortcuts. For instance, a self-made business person can inspire others to [[be persistent]], but someone who [[cheated their way to the top]] is definitely not a good example.',
      tips: 'Cấu trúc: Trả lời trực tiếp -> Giải thích (tùy vào cách đạt được) -> Ví dụ (người tự thân và người gian lận).'
    },
    {
      id: 'p3_1_2',
      text: 'Do you think famous people have a responsibility to be good role models?',
      sampleAnswer: 'Definitely, I believe they have a [[major responsibility]]. Since they\'re [[constantly in the public eye]], their actions can [[significantly influence]] the behavior of the [[younger generation]]. To illustrate, if a celebrity promotes [[healthy habits]], their followers are much more likely to [[follow suit]].',
      tips: 'Cấu trúc: Khẳng định -> Giải thích (sự ảnh hưởng lên giới trẻ) -> Ví dụ (quảng bá thói quen tốt).'
    },
    {
      id: 'p3_1_3',
      text: 'How have role models changed compared to the past?',
      sampleAnswer: 'In my view, the source of inspiration has shifted drastically. In the past, role models were mostly [[historical figures]] or family members, whereas nowadays, [[social media influencers]] often take that place. For example, many teenagers today look up to [[YouTubers]] more than they do to historical heroes.',
      tips: 'Cấu trúc: Ý kiến (thay đổi nguồn cảm hứng) -> Giải thích (xưa vs nay) -> Ví dụ (YouTubers).'
    },
    {
      id: 'p3_1_4',
      text: 'Should children be taught about role models in school?',
      sampleAnswer: 'Yes, I think it\'s [[essential]] for their development. It can help them develop [[positive values]] and [[moral standards]] from an early age. Reading about [[inspiring figures]] like scientists or activists in class can motivate them to [[dream big]] and work hard.',
      tips: 'Cấu trúc: Đồng ý -> Giải thích (phát triển giá trị đạo đức) -> Ví dụ (nhà khoa học/nhà hoạt động).'
    },
    {
      id: 'p3_1_5',
      text: 'What are the main differences between a celebrity and a role model?',
      sampleAnswer: 'I think the main difference lies in [[character and values]]. A celebrity is simply someone who is [[well-known]], but a role model is someone whose [[admirable actions]] we want to [[imitate]]. For instance, a pop star might be famous for their voice, but a volunteer is a role model for their [[kindness]].',
      tips: 'Cấu trúc: Khác biệt ở nhân cách -> Giải thích (nổi tiếng vs đáng ngưỡng mộ) -> Ví dụ (ca sĩ vs tình nguyện viên).'
    },
    {
      id: 'p3_1_6',
      text: 'How can parents be better role models for their children?',
      sampleAnswer: 'Basically, I think they should always [[lead by example]]. Children tend to [[copy what they see]] rather than what they are told, so parents must show [[integrity]] in their own lives. For example, if parents [[speak politely]] to others, their kids will likely [[follow suit]].',
      tips: 'Cấu trúc: Làm gương -> Giải thích (trẻ em bắt chước hành động) -> Ví dụ (cách nói chuyện lịch sự).'
    },
    {
      id: 'p3_1_7',
      text: 'Do you think society puts too much pressure on famous people to be perfect?',
      sampleAnswer: 'To some extent, yes, I believe [[expectations]] are often too high. We often forget that celebrities are [[human beings]] who can make mistakes just like anyone else. Expecting them to be [[flawless]] in every single situation is quite [[unrealistic]].',
      tips: 'Cấu trúc: Đồng ý một phần -> Giải thích (con người ai cũng có lỗi) -> Ví dụ (kỳ vọng không thực tế).'
    },
    {
      id: 'p3_1_8',
      text: 'Can someone be a role model even if they have made major mistakes in their life?',
      sampleAnswer: 'Absolutely, because the way someone [[overcomes their mistakes]] can be very educational. Learning from failure is a [[valuable lesson]] for anyone. For instance, a person who [[battled an addiction]] and successfully recovered can be an [[incredible inspiration]] to others facing the same struggle.',
      tips: 'Cấu trúc: Chắc chắn -> Giải thích (học từ sai lầm) -> Ví dụ (vượt qua nghiện ngập).'
    }
  ]
};
