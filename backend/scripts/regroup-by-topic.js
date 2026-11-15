import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data', 'oxford_3000_structured_4tiers.json');

/**
 * Danh sách 16 Chủ đề Ngữ nghĩa (Thematic Topics) theo thứ tự ưu tiên phân loại
 */
const TOPICS = [
  {
    id: 'family_people',
    title: '👨‍👩‍👧‍👦 Gia đình, Con người & Mối quan hệ',
    enWords: new Set([
      'family', 'father', 'mother', 'parent', 'parents', 'son', 'daughter', 'brother', 'sister',
      'husband', 'wife', 'child', 'children', 'baby', 'boy', 'girl', 'man', 'men', 'woman', 'women',
      'person', 'people', 'adult', 'teenager', 'youth', 'grandfather', 'grandmother', 'grandparent',
      'grandson', 'granddaughter', 'grandchild', 'uncle', 'aunt', 'cousin', 'nephew', 'niece',
      'friend', 'friendship', 'boyfriend', 'girlfriend', 'partner', 'couple', 'marriage', 'marry',
      'married', 'wedding', 'bride', 'divorce', 'single', 'relative', 'relation', 'relationship',
      'neighbour', 'neighbor', 'guest', 'visitor', 'member', 'crowd', 'generation', 'human',
      'gentleman', 'lady', 'guy', 'kid', 'twin', 'ancestors', 'birth', 'born', 'age', 'old', 'young',
      'elderly', 'male', 'female', 'name', 'surname', 'first name', 'miss', 'mr', 'mrs', 'ms',
      'love', 'date', 'hug', 'kiss', 'care', 'trust', 'companion', 'colleague', 'acquaintance'
    ]),
    viKeywords: [
      'gia đình', 'bố', 'cha', 'mẹ', 'con trai', 'con gái', 'anh trai', 'em trai', 'chị gái', 'em gái',
      'vợ', 'chồng', 'em bé', 'đứa trẻ', 'trẻ em', 'người lớn', 'thanh thiếu niên', 'ông', 'bà',
      'cháu', 'chú', 'bác', 'cô', 'dì', 'cậu', 'mợ', 'anh chị em họ', 'bạn bè', 'tình bạn',
      'bạn trai', 'bạn gái', 'kết hôn', 'đám cưới', 'cô dâu', 'chú rể', 'ly hôn', 'họ hàng',
      'mối quan hệ', 'hàng xóm', 'khách', 'thế hệ', 'con người', 'đàn ông', 'phụ nữ', 'quý ông', 'quý bà'
    ]
  },
  {
    id: 'food_drink',
    title: '🍎 Ẩm thực, Đồ ăn & Thức uống',
    enWords: new Set([
      'food', 'eat', 'drink', 'meal', 'breakfast', 'lunch', 'dinner', 'snack', 'water', 'milk',
      'tea', 'coffee', 'juice', 'beer', 'wine', 'alcohol', 'bread', 'butter', 'cheese', 'rice',
      'meat', 'beef', 'pork', 'chicken', 'fish', 'egg', 'soup', 'salad', 'sandwich', 'pizza',
      'pasta', 'cake', 'chocolate', 'biscuit', 'cookie', 'sweet', 'candy', 'ice cream', 'sugar',
      'salt', 'pepper', 'oil', 'sauce', 'spice', 'fruit', 'apple', 'banana', 'orange', 'lemon',
      'strawberry', 'grape', 'vegetable', 'potato', 'tomato', 'onion', 'carrot', 'bean', 'corn',
      'nut', 'cook', 'cooking', 'cooker', 'bake', 'boil', 'fry', 'roast', 'grill', 'pour', 'mix',
      'stir', 'slice', 'taste', 'delicious', 'hungry', 'thirsty', 'full', 'diet', 'menu', 'restaurant',
      'cafe', 'bar', 'pub', 'waiter', 'waitress', 'chef', 'dish', 'plate', 'bowl', 'cup', 'glass',
      'mug', 'bottle', 'can', 'fork', 'knife', 'spoon', 'pan', 'pot', 'oven', 'fridge', 'kettle',
      'recipe', 'ingredient', 'flavour', 'flavor', 'sour', 'bitter', 'spicy', 'fresh', 'raw', 'frozen'
    ]),
    viKeywords: [
      'thức ăn', 'đồ ăn', 'ăn', 'uống', 'bữa ăn', 'bữa sáng', 'bữa trưa', 'bữa tối', 'nước', 'sữa',
      'trà', 'cà phê', 'nước ép', 'bia', 'rượu', 'bánh mì', 'bơ', 'phô mai', 'cơm', 'gạo', 'thịt',
      'thịt bò', 'thịt lợn', 'thịt gà', 'cá', 'trứng', 'súp', 'canh', 'bánh ngọt', 'sô cô la',
      'kem', 'đường', 'muối', 'tiêu', 'trái cây', 'hoa quả', 'táo', 'chuối', 'cam', 'chanh',
      'rau', 'khoai tây', 'cà chua', 'hành tây', 'cà rốt', 'đậu', 'nấu ăn', 'nướng', 'luộc', 'chiên',
      'xào', 'ngon', 'đói', 'khát', 'thực đơn', 'nhà hàng', 'quán cà phê', 'bồi bàn', 'đầu bếp',
      'món ăn', 'đĩa', 'bát', 'tô', 'cốc', 'ly', 'chai', 'nĩa', 'dao', 'thìa', 'muỗng', 'chảo',
      'nồi', 'lò nướng', 'tủ lạnh', 'công thức nấu', 'gia vị', 'nguyên liệu'
    ]
  },
  {
    id: 'home_daily',
    title: '🏠 Nhà cửa, Đồ vật & Đời sống hàng ngày',
    enWords: new Set([
      'home', 'house', 'flat', 'apartment', 'building', 'room', 'bedroom', 'bathroom', 'kitchen',
      'living room', 'garden', 'yard', 'garage', 'hall', 'corridor', 'floor', 'wall', 'ceiling',
      'roof', 'door', 'gate', 'window', 'stairs', 'step', 'lift', 'elevator', 'furniture', 'table',
      'chair', 'desk', 'sofa', 'couch', 'bed', 'sheet', 'blanket', 'pillow', 'carpet', 'rug',
      'curtain', 'mirror', 'lamp', 'light', 'clock', 'shelf', 'cupboard', 'wardrobe', 'drawer',
      'box', 'bag', 'basket', 'container', 'key', 'lock', 'bell', 'rubbish', 'trash', 'garbage',
      'bin', 'waste', 'clean', 'wash', 'sweep', 'tidy', 'dirty', 'mess', 'soap', 'towel', 'brush',
      'comb', 'toothbrush', 'shower', 'bath', 'toilet', 'sink', 'tap', 'pipe', 'heater', 'heating',
      'air conditioning', 'fan', 'iron', 'washing machine', 'tool', 'hammer', 'nail', 'rope', 'string',
      'wire', 'chain', 'wheel', 'toy', 'umbrella', 'watch', 'glasses', 'purse', 'wallet', 'ring',
      'jewellery', 'jewelry', 'clothes', 'clothing', 'shirt', 't-shirt', 'trousers', 'pants', 'jeans',
      'shorts', 'skirt', 'dress', 'suit', 'coat', 'jacket', 'sweater', 'jumper', 'hat', 'cap',
      'shoe', 'boot', 'sock', 'glove', 'scarf', 'tie', 'belt', 'pocket', 'button', 'collar', 'sleeve',
      'wear', 'put on', 'take off', 'fit', 'fashion', 'style', 'cotton', 'wool', 'leather', 'silk',
      'plastic', 'wood', 'wooden', 'metal', 'iron', 'steel', 'gold', 'silver', 'glass', 'paper',
      'cardboard', 'stone', 'brick', 'rubber', 'cloth', 'fabric', 'material', 'object', 'stuff', 'thing'
    ]),
    viKeywords: [
      'ngôi nhà', 'nhà ở', 'căn hộ', 'phòng ngủ', 'phòng tắm', 'nhà bếp', 'phòng khách', 'khu vườn',
      'sàn nhà', 'bức tường', 'trần nhà', 'mái nhà', 'cánh cửa', 'cửa sổ', 'cầu thang', 'thang máy',
      'nội thất', 'cái bàn', 'cái ghế', 'ghế sofa', 'cái giường', 'chăn', 'gối', 'thảm', 'rèm cửa',
      'gương', 'đèn', 'đồng hồ', 'kệ', 'tủ quần áo', 'ngăn kéo', 'cái hộp', 'cái túi', 'chìa khóa',
      'ổ khóa', 'rác', 'thùng rác', 'dọn dẹp', 'giặt', 'rửa', 'xà phòng', 'khăn tắm', 'bàn chải',
      'lược', 'vòi sen', 'bồn tắm', 'nhà vệ sinh', 'ống nước', 'máy giặt', 'bàn ủi', 'dụng cụ',
      'cái búa', 'sợi dây', 'cái ô', 'dù', 'kính mắt', 'ví tiền', 'nhẫn', 'trang sức', 'quần áo',
      'áo sơ mi', 'áo thun', 'quần dài', 'quần bò', 'chân váy', 'váy', 'áo khoác', 'áo len', 'mũ',
      'nón', 'giày', 'ủng', 'tất', 'vớ', 'găng tay', 'khăn quàng', 'cà vạt', 'thắt lưng', 'túi áo',
      'cúc áo', 'mặc', 'thời trang', 'nhựa', 'gỗ', 'kim loại', 'thép', 'vàng', 'bạc', 'thủy tinh',
      'giấy', 'gạch', 'cao su', 'vải'
    ]
  },
  {
    id: 'travel_transport',
    title: '✈️ Du lịch, Giao thông & Địa điểm',
    enWords: new Set([
      'travel', 'trip', 'journey', 'tour', 'tourism', 'tourist', 'holiday', 'vacation', 'flight',
      'fly', 'plane', 'airplane', 'aircraft', 'airport', 'airline', 'pilot', 'passenger', 'passport',
      'ticket', 'luggage', 'baggage', 'suitcase', 'hotel', 'reception', 'camp', 'camping', 'tent',
      'map', 'guide', 'guidebook', 'destination', 'sightseeing', 'abroad', 'foreign', 'foreigner',
      'transport', 'transportation', 'traffic', 'vehicle', 'car', 'bus', 'coach', 'train', 'railway',
      'rail', 'underground', 'subway', 'metro', 'tram', 'taxi', 'cab', 'truck', 'lorry', 'van',
      'bike', 'bicycle', 'cycle', 'motorcycle', 'motorbike', 'scooter', 'boat', 'ship', 'ferry',
      'sail', 'port', 'harbour', 'harbor', 'station', 'stop', 'platform', 'terminal', 'road',
      'street', 'avenue', 'highway', 'motorway', 'path', 'lane', 'pavement', 'sidewalk', 'bridge',
      'tunnel', 'corner', 'crossing', 'crossroads', 'roundabout', 'park', 'parking', 'petrol',
      'gas', 'fuel', 'engine', 'tyre', 'tire', 'brake', 'seat', 'seatbelt', 'drive', 'driver',
      'ride', 'rider', 'arrive', 'arrival', 'depart', 'departure', 'leave', 'return', 'reach',
      'place', 'area', 'region', 'zone', 'district', 'city', 'town', 'village', 'capital', 'country',
      'countryside', 'suburb', 'downtown', 'centre', 'center', 'square', 'market', 'shop', 'store',
      'supermarket', 'mall', 'department store', 'library', 'museum', 'gallery', 'castle', 'palace',
      'temple', 'church', 'mosque', 'cathedral', 'tower', 'statue', 'monument', 'post office',
      'embassy', 'factory', 'farm', 'location', 'position', 'direction', 'north', 'south', 'east',
      'west', 'northern', 'southern', 'eastern', 'western', 'distance', 'border', 'local', 'route', 'way'
    ]),
    viKeywords: [
      'du lịch', 'chuyến đi', 'hành trình', 'du khách', 'kỳ nghỉ', 'chuyến bay', 'máy bay', 'sân bay',
      'phi công', 'hành khách', 'hộ chiếu', 'vé', 'hành lý', 'vali', 'khách sạn', 'cắm trại', 'lều',
      'bản đồ', 'hướng dẫn viên', 'điểm đến', 'nước ngoài', 'giao thông', 'phương tiện', 'xe hơi',
      'ô tô', 'xe buýt', 'tàu hỏa', 'đường sắt', 'tàu điện', 'xe tải', 'xe đạp', 'xe máy', 'thuyền',
      'tàu thủy', 'bến cảng', 'nhà ga', 'trạm dừng', 'con đường', 'đường phố', 'đại lộ', 'cao tốc',
      'vỉa hè', 'cây cầu', 'đường hầm', 'ngã tư', 'bãi đỗ xe', 'xăng', 'nhiên liệu', 'động cơ',
      'lái xe', 'tài xế', 'khởi hành', 'địa điểm', 'khu vực', 'vùng', 'thành phố', 'thị trấn',
      'ngôi làng', 'thủ đô', 'quốc gia', 'nông thôn', 'ngoại ô', 'quảng trường', 'chợ', 'cửa hàng',
      'siêu thị', 'bảo tàng', 'lâu đài', 'cung điện', 'ngôi đền', 'nhà thờ', 'bưu điện', 'nhà máy',
      'trang trại', 'phía bắc', 'phía nam', 'phía đông', 'phía tây', 'biên giới', 'lộ trình'
    ]
  },
  {
    id: 'work_business',
    title: '💼 Công việc, Kinh doanh & Tài chính',
    enWords: new Set([
      'work', 'job', 'career', 'profession', 'professional', 'occupation', 'employment', 'employ',
      'employee', 'employer', 'unemployed', 'unemployment', 'worker', 'staff', 'crew', 'team',
      'boss', 'manager', 'management', 'director', 'executive', 'president', 'chairman', 'leader',
      'leadership', 'assistant', 'secretary', 'clerk', 'agent', 'representative', 'client',
      'customer', 'consumer', 'business', 'company', 'firm', 'corporation', 'enterprise', 'organization',
      'organisation', 'agency', 'branch', 'department', 'office', 'factory', 'industry', 'industrial',
      'sector', 'market', 'marketing', 'advertise', 'advertisement', 'advertising', 'ad', 'commercial',
      'brand', 'product', 'production', 'produce', 'manufacturer', 'manufacture', 'goods', 'service',
      'supply', 'supplier', 'demand', 'trade', 'export', 'import', 'retail', 'deal', 'contract',
      'agreement', 'negotiate', 'negotiation', 'meeting', 'conference', 'presentation', 'agenda',
      'project', 'plan', 'strategy', 'goal', 'target', 'objective', 'task', 'duty', 'responsibility',
      'experience', 'qualification', 'skill', 'training', 'interview', 'hire', 'recruit', 'promote',
      'promotion', 'retire', 'retirement', 'resign', 'quit', 'fire', 'sack', 'strike', 'union',
      'money', 'cash', 'coin', 'note', 'currency', 'dollar', 'euro', 'pound', 'cent', 'penny',
      'price', 'cost', 'value', 'worth', 'cheap', 'expensive', 'free', 'discount', 'sale', 'offer',
      'pay', 'payment', 'salary', 'wage', 'income', 'earning', 'profit', 'loss', 'benefit', 'bonus',
      'pension', 'tax', 'taxation', 'fee', 'charge', 'fine', 'bill', 'receipt', 'cheque', 'check',
      'credit', 'card', 'debit', 'debt', 'loan', 'borrow', 'lend', 'owe', 'afford', 'spend', 'save',
      'saving', 'invest', 'investment', 'investor', 'share', 'stock', 'fund', 'funding', 'capital',
      'budget', 'finance', 'financial', 'economy', 'economic', 'economics', 'bank', 'account',
      'insurance', 'property', 'wealth', 'wealthy', 'rich', 'poor', 'poverty', 'buy', 'buyer',
      'sell', 'seller', 'purchase', 'order', 'deliver', 'delivery', 'insurance', 'accountant'
    ]),
    viKeywords: [
      'công việc', 'việc làm', 'sự nghiệp', 'nghề nghiệp', 'chuyên nghiệp', 'nhân viên', 'người lao động',
      'thất nghiệp', 'ông chủ', 'quản lý', 'giám đốc', 'chủ tịch', 'lãnh đạo', 'trợ lý', 'thư ký',
      'khách hàng', 'người tiêu dùng', 'kinh doanh', 'doanh nghiệp', 'công ty', 'tập đoàn', 'tổ chức',
      'chi nhánh', 'phòng ban', 'văn phòng', 'công nghiệp', 'thị trường', 'tiếp thị', 'quảng cáo',
      'thương hiệu', 'sản phẩm', 'sản xuất', 'hàng hóa', 'dịch vụ', 'cung cấp', 'nhập khẩu', 'xuất khẩu',
      'thương mại', 'hợp đồng', 'thỏa thuận', 'đàm phán', 'cuộc họp', 'hội nghị', 'dự án', 'chiến lược',
      'mục tiêu', 'nhiệm vụ', 'kinh nghiệm', 'kỹ năng', 'phỏng vấn', 'tuyển dụng', 'thăng chức',
      'nghỉ hưu', 'từ chức', 'sa thải', 'tiền', 'tiền mặt', 'tiền tệ', 'giá cả', 'chi phí', 'giá trị',
      'đắt', 'rẻ', 'giảm giá', 'thanh toán', 'tiền lương', 'thu nhập', 'lợi nhuận', 'thua lỗ',
      'lương hưu', 'thuế', 'học phí', 'lệ phí', 'hóa đơn', 'biên lai', 'tín dụng', 'khoản nợ',
      'khoản vay', 'vay', 'mượn', 'tiết kiệm', 'đầu tư', 'nhà đầu tư', 'cổ phiếu', 'quỹ', 'ngân sách',
      'tài chính', 'kinh tế', 'ngân hàng', 'tài khoản', 'bảo hiểm', 'tài sản', 'giàu có', 'nghèo đói'
    ]
  },
  {
    id: 'education_language',
    title: '🎓 Giáo dục, Trường học & Ngôn ngữ',
    enWords: new Set([
      'school', 'primary', 'secondary', 'high school', 'college', 'university', 'academy', 'academic',
      'campus', 'education', 'educational', 'educate', 'study', 'student', 'pupil', 'undergraduate',
      'graduate', 'graduation', 'class', 'classroom', 'lesson', 'course', 'curriculum', 'subject',
      'lecture', 'lecturer', 'seminar', 'tutorial', 'teacher', 'teach', 'teaching', 'professor',
      'instructor', 'trainer', 'coach', 'headteacher', 'principal', 'learn', 'learner', 'learning',
      'knowledge', 'revise', 'revision', 'exam', 'examination', 'test', 'quiz', 'grade', 'mark',
      'score', 'result', 'pass', 'fail', 'failure', 'certificate', 'degree', 'diploma', 'qualification',
      'scholarship', 'homework', 'assignment', 'essay', 'paper', 'project', 'research', 'researcher',
      'library', 'laboratory', 'lab', 'book', 'textbook', 'dictionary', 'notebook', 'page', 'chapter',
      'title', 'topic', 'title', 'author', 'writer', 'read', 'reader', 'reading', 'write', 'writing',
      'pen', 'pencil', 'ruler', 'rubber', 'eraser', 'board', 'chalk', 'language', 'word', 'vocabulary',
      'grammar', 'sentence', 'phrase', 'clause', 'paragraph', 'passage', 'text', 'letter', 'alphabet',
      'spell', 'spelling', 'pronounce', 'pronunciation', 'accent', 'meaning', 'definition', 'translate',
      'translation', 'fluent', 'native', 'bilingual', 'speak', 'speaker', 'speech', 'talk', 'conversation',
      'dialogue', 'discuss', 'discussion', 'debate', 'question', 'answer', 'reply', 'explain',
      'explanation', 'describe', 'description', 'example', 'summary', 'quote', 'note', 'list',
      'maths', 'math', 'mathematics', 'history', 'geography', 'biology', 'chemistry', 'physics',
      'philosophy', 'psychology', 'literature', 'poetry', 'poem', 'poet', 'novel', 'story', 'tale', 'fiction'
    ]),
    viKeywords: [
      'trường học', 'tiểu học', '중 học', 'đại học', 'cao đẳng', 'học viện', 'giáo dục', 'học tập',
      'học sinh', 'sinh viên', 'tốt nghiệp', 'lớp học', 'bài học', 'khóa học', 'môn học', 'bài giảng',
      'giảng viên', 'giáo viên', 'giáo sư', 'người hướng dẫn', 'kiến thức', 'ôn tập', 'kỳ thi',
      'bài kiểm tra', 'điểm số', 'bằng cấp', 'chứng chỉ', 'học bổng', 'bài tập về nhà', 'tiểu luận',
      'nghiên cứu', 'thư viện', 'phòng thí nghiệm', 'sách giáo khoa', 'từ điển', 'quyển sách',
      'chương', 'tác giả', 'nhà văn', 'bút', 'bút chì', 'thước kẻ', 'ngôn ngữ', 'từ vựng', 'ngữ pháp',
      'câu', 'cụm từ', 'đoạn văn', 'chữ cái', 'bảng chữ cái', 'đánh vần', 'phát âm', 'giọng điệu',
      'ý nghĩa', 'định nghĩa', 'dịch thuật', 'bản dịch', 'trôi chảy', 'hội thoại', 'thảo luận',
      'tranh luận', 'câu hỏi', 'câu trả lời', 'giải thích', 'mô tả', 'ví dụ', 'tóm tắt', 'toán học',
      'lịch sử', 'địa lý', 'sinh học', 'hóa học', 'vật lý', 'triết học', 'tâm lý học', 'văn học',
      'thơ ca', 'bài thơ', 'nhà thơ', 'tiểu thuyết', 'câu chuyện'
    ]
  },
  {
    id: 'body_health',
    title: '🏥 Cơ thể, Sức khỏe & Y tế',
    enWords: new Set([
      'body', 'head', 'face', 'hair', 'eye', 'ear', 'nose', 'mouth', 'lip', 'tooth', 'teeth',
      'tongue', 'chin', 'cheek', 'neck', 'throat', 'shoulder', 'arm', 'elbow', 'wrist', 'hand',
      'finger', 'thumb', 'nail', 'chest', 'breast', 'back', 'waist', 'stomach', 'belly', 'hip',
      'leg', 'knee', 'ankle', 'foot', 'feet', 'toe', 'heel', 'skin', 'bone', 'muscle', 'blood',
      'heart', 'brain', 'lung', 'liver', 'nerve', 'cell', 'gene', 'genetic', 'sight', 'hearing',
      'smell', 'touch', 'voice', 'breath', 'breathe', 'sweat', 'tear', 'smile', 'laugh', 'cry',
      'sleep', 'asleep', 'awake', 'wake', 'dream', 'tired', 'exhausted', 'rest', 'relax',
      'health', 'healthy', 'unhealthy', 'fit', 'fitness', 'exercise', 'ill', 'illness', 'sick',
      'sickness', 'disease', 'infection', 'infected', 'virus', 'bacteria', 'flu', 'cold', 'cough',
      'fever', 'temperature', 'headache', 'toothache', 'stomachache', 'pain', 'painful', 'ache',
      'hurt', 'injure', 'injured', 'injury', 'wound', 'wounded', 'bleed', 'blood', 'broken',
      'burn', 'swollen', 'cancer', 'heart attack', 'stroke', 'stress', 'mental', 'blind', 'deaf',
      'disabled', 'disability', 'pregnant', 'pregnancy', 'hospital', 'clinic', 'doctor', 'nurse',
      'dentist', 'surgeon', 'patient', 'medical', 'medicine', 'drug', 'pill', 'tablet', 'antibiotic',
      'vaccine', 'treatment', 'treat', 'cure', 'heal', 'recover', 'recovery', 'operation', 'surgery',
      'therapy', 'emergency', 'ambulance', 'bandage', 'injection', 'symptom', 'examine', 'check-up',
      'alive', 'live', 'life', 'die', 'dead', 'death', 'kill', 'survive', 'survival'
    ]),
    viKeywords: [
      'cơ thể', 'cái đầu', 'khuôn mặt', 'mái tóc', 'đôi mắt', 'đôi tai', 'cái mũi', 'cái miệng',
      'đôi môi', 'cái răng', 'cái lưỡi', 'cái cổ', 'cổ họng', 'đôi vai', 'cánh tay', 'khuỷu tay',
      'cổ tay', 'bàn tay', 'ngón tay', 'ngực', 'cái lưng', 'dạ dày', 'bụng', 'đôi chân', 'đầu gối',
      'mắt cá', 'bàn chân', 'ngón chân', 'làn da', 'xương', 'cơ bắp', 'máu', 'trái tim', 'bộ não',
      'phổi', 'gan', 'dây thần kinh', 'tế bào', 'di truyền', 'hơi thở', 'thở', 'mồ hôi', 'nước mắt',
      'giấc ngủ', 'buồn ngủ', 'thức dậy', 'giấc mơ', 'mệt mỏi', 'kiệt sức', 'nghỉ ngơi', 'sức khỏe',
      'khỏe mạnh', 'tập thể dục', 'ốm', 'bệnh tật', ' căn bệnh', 'nhiễm trùng', 'vi-rút', 'vi khuẩn',
      'cảm cúm', 'cảm lạnh', 'ho', 'sốt', 'đau đầu', 'đau răng', 'đau đớn', 'bị thương', 'chấn thương',
      'vết thương', 'chảy máu', 'ung thư', 'căng thẳng', 'mù', 'điếc', 'khuyết tật', 'mang thai',
      'bệnh viện', 'phòng khám', 'bác sĩ', 'y tá', 'nha sĩ', 'bệnh nhân', 'y tế', 'thuốc', 'viên thuốc',
      'điều trị', 'chữa lành', 'hồi phục', 'phẫu thuật', 'trị liệu', 'cấp cứu', 'xe cứu thương',
      'triệu chứng', 'sống sót', 'cái chết', 'tử vong'
    ]
  },
  {
    id: 'nature_weather',
    title: '🌿 Thiên nhiên, Động vật & Thời tiết',
    enWords: new Set([
      'nature', 'natural', 'environment', 'environmental', 'climate', 'weather', 'air', 'atmosphere',
      'sky', 'sun', 'sunny', 'sunshine', 'moon', 'star', 'earth', 'world', 'planet', 'space',
      'universe', 'cloud', 'cloudy', 'rain', 'rainy', 'snow', 'snowy', 'ice', 'icy', 'frost',
      'freeze', 'wind', 'windy', 'storm', 'thunder', 'lightning', 'fog', 'foggy', 'wet', 'dry',
      'warm', 'hot', 'heat', 'cool', 'cold', 'temperature', 'degree', 'season', 'spring', 'summer',
      'autumn', 'fall', 'winter', 'land', 'landscape', 'ground', 'soil', 'mud', 'dust', 'sand',
      'rock', 'stone', 'mountain', 'hill', 'valley', 'cliff', 'cave', 'desert', 'forest', 'wood',
      'jungle', 'field', 'grass', 'island', 'coast', 'shore', 'beach', 'sea', 'ocean', 'wave',
      'tide', 'river', 'stream', 'lake', 'pond', 'pool', 'flood', 'earthquake', 'disaster',
      'pollution', 'pollute', 'recycle', 'waste', 'global warming', 'energy', 'solar', 'coal',
      'plant', 'tree', 'leaf', 'leaves', 'branch', 'root', 'seed', 'flower', 'rose', 'bush', 'grow',
      'animal', 'wild', 'wildlife', 'pet', 'dog', 'cat', 'horse', 'cow', 'sheep', 'pig', 'goat',
      'chicken', 'duck', 'bird', 'wing', 'feather', 'nest', 'fish', 'shark', 'whale', 'dolphin',
      'lion', 'tiger', 'bear', 'elephant', 'monkey', 'snake', 'frog', 'mouse', 'rat', 'rabbit',
      'deer', 'fox', 'wolf', 'camel', 'insect', 'bee', 'butterfly', 'spider', 'ant', 'fly', 'mosquito',
      'tail', 'fur', 'horn', 'shell', 'hunt', 'feed', 'breed', 'species', 'creature'
    ]),
    viKeywords: [
      'thiên nhiên', 'tự nhiên', 'môi trường', 'khí hậu', 'thời tiết', 'không khí', 'bầu trời',
      'mặt trời', 'nắng', 'mặt trăng', 'ngôi sao', 'trái đất', 'hành tinh', 'vũ trụ', 'đám mây',
      'mưa', 'tuyết', 'băng', 'đóng băng', 'gió', 'bão', 'sấm sét', 'sương mù', 'ẩm ướt', 'khô ráo',
      'ấm áp', 'nóng bức', 'mát mẻ', 'lạnh giá', 'nhiệt độ', 'mùa xuân', 'mùa hè', 'mùa thu',
      'mùa đông', 'mặt đất', 'đất đai', 'bùn', 'bụi', 'cát', 'tảng đá', 'ngọn núi', 'ngọn đồi',
      'thung lũng', 'vách đá', 'hang động', 'sa mạc', 'khu rừng', 'rừng rậm', 'cánh đồng', 'bãi cỏ',
      'hòn đảo', 'bờ biển', 'bãi biển', 'đại dương', 'biển', 'con sóng', 'thủy triều', 'dòng sông',
      'con suối', 'cái hồ', 'lũ lụt', 'động đất', 'thảm họa', 'ô nhiễm', 'tái chế', 'thực vật',
      'cái cây', 'chiếc lá', 'cành cây', 'rễ cây', 'hạt giống', 'bông hoa', 'động vật', 'hoang dã',
      'thú cưng', 'con chó', 'con mèo', 'con ngựa', 'con bò', 'con cừu', 'con lợn', 'con gà',
      'con vịt', 'con chim', 'đôi cánh', 'lông vũ', 'tổ chim', 'cá mập', 'cá voi', 'sư tử', 'con hổ',
      'con gấu', 'con voi', 'con khỉ', 'con rắn', 'con ếch', 'con chuột', 'con thỏ', 'con cáo',
      'con sói', 'côn trùng', 'con ong', 'bươm bướm', 'con nhện', 'con kiến', 'con muỗi', 'cái đuôi',
      'bộ lông', 'loài vật', 'sinh vật'
    ]
  },
  {
    id: 'media_arts_sports',
    title: '🎨 Giải trí, Nghệ thuật, Thể thao & Truyền thông',
    enWords: new Set([
      'art', 'artist', 'artistic', 'paint', 'painter', 'painting', 'draw', 'drawing', 'picture',
      'photo', 'photograph', 'photographer', 'photography', 'camera', 'image', 'portrait',
      'exhibition', 'gallery', 'museum', 'sculpture', 'statue', 'design', 'designer', 'fashion',
      'music', 'musical', 'musician', 'song', 'sing', 'singer', 'band', 'concert', 'orchestra',
      'instrument', 'piano', 'guitar', 'drum', 'violin', 'jazz', 'pop', 'rock', 'classical',
      'dance', 'dancer', 'dancing', 'album', 'record', 'recording', 'track', 'tune', 'rhythm',
      'film', 'movie', 'cinema', 'theatre', 'theater', 'stage', 'play', 'actor', 'actress',
      'performance', 'perform', 'performer', 'director', 'scene', 'role', 'character', 'hero',
      'comedy', 'drama', 'horror', 'adventure', 'mystery', 'entertain', 'entertainment', 'audience',
      'spectator', 'fan', 'star', 'celebrity', 'famous', 'festival', 'party', 'celebrate',
      'celebration', 'hobby', 'leisure', 'free time', 'fun', 'funny', 'joke', 'humour', 'humor',
      'laugh', 'game', 'toy', 'card', 'chess', 'puzzle', 'video game', 'media', 'press', 'news',
      'newspaper', 'magazine', 'journal', 'journalist', 'reporter', 'report', 'article', 'headline',
      'editor', 'publish', 'publisher', 'publication', 'broadcast', 'television', 'tv', 'radio',
      'channel', 'programme', 'program', 'series', 'episode', 'show', 'interview', 'podcast', 'blog',
      'sport', 'sports', 'athlete', 'athletics', 'player', 'team', 'club', 'coach', 'captain',
      'match', 'game', 'competition', 'compete', 'competitor', 'tournament', 'championship',
      'champion', 'race', 'racing', 'run', 'runner', 'running', 'swim', 'swimmer', 'swimming',
      'pool', 'football', 'soccer', 'basketball', 'baseball', 'tennis', 'golf', 'volleyball',
      'hockey', 'rugby', 'cricket', 'ski', 'skiing', 'skate', 'skating', 'surf', 'surfing',
      'climb', 'climbing', 'gym', 'ball', 'goal', 'net', 'court', 'pitch', 'stadium', 'track',
      'score', 'point', 'win', 'winner', 'lose', 'loser', 'beat', 'defeat', 'draw', 'tie', 'medal',
      'prize', 'award', 'trophy', 'record', 'train', 'training', 'kick', 'throw', 'catch', 'hit', 'jump'
    ]),
    viKeywords: [
      'nghệ thuật', 'nghệ sĩ', 'họa sĩ', 'bức tranh', 'vẽ', 'bức ảnh', 'nhiếp ảnh', 'máy ảnh',
      'triển lãm', 'bảo tàng', 'điêu khắc', 'thiết kế', 'âm nhạc', 'nhạc sĩ', 'bài hát', 'ca sĩ',
      'ban nhạc', 'buổi hòa nhạc', 'nhạc cụ', 'đàn piano', 'đàn guitar', 'trống', 'khiêu vũ',
      'nhảy múa', 'vũ công', 'điện ảnh', 'bộ phim', 'rạp chiếu phim', 'nhà hát', 'sân khấu',
      'vở kịch', 'diễn viên', 'biểu diễn', 'đạo diễn', 'nhân vật', 'anh hùng', 'hài kịch', 'giải trí',
      'khán giả', 'người hâm mộ', 'ngôi sao', 'nổi tiếng', 'lễ hội', 'bữa tiệc', 'kỷ niệm', 'sở thích',
      'trò chơi', 'cờ vua', 'truyền thông', 'báo chí', 'tin tức', 'tờ báo', 'tạp chí', 'nhà báo',
      'phóng viên', 'bài báo', 'biên tập viên', 'xuất bản', 'phát sóng', 'truyền hình', 'tivi',
      'đài phát thanh', 'chương trình', 'tập phim', 'thể thao', 'vận động viên', 'cầu thủ',
      'đội tuyển', 'câu lạc bộ', 'huấn luyện viên', 'trận đấu', 'cuộc thi', 'giải đấu', 'nhà vô địch',
      'cuộc đua', 'bơi lội', 'bóng đá', 'bóng rổ', 'bóng chuyền', 'quần vợt', 'trượt tuyết',
      'leo núi', 'phòng tập', 'quả bóng', 'bàn thắng', 'sân vận động', 'chiến thắng', 'người chiến thắng',
      'thất bại', 'huy chương', 'giải thưởng', 'cúp'
    ]
  },
  {
    id: 'science_tech',
    title: '💻 Khoa học, Công nghệ & Kỹ thuật',
    enWords: new Set([
      'science', 'scientific', 'scientist', 'technology', 'technological', 'technical', 'technique',
      'engineer', 'engineering', 'machine', 'machinery', 'device', 'equipment', 'instrument',
      'apparatus', 'system', 'network', 'computer', 'laptop', 'tablet', 'screen', 'monitor',
      'keyboard', 'mouse', 'printer', 'hardware', 'software', 'program', 'programme', 'code',
      'coding', 'data', 'database', 'digital', 'electronic', 'electric', 'electrical', 'electricity',
      'power', 'battery', 'charge', 'cable', 'wire', 'plug', 'switch', 'button', 'signal', 'radio',
      'radar', 'satellite', 'robot', 'artificial', 'ai', 'internet', 'web', 'website', 'site',
      'online', 'offline', 'email', 'message', 'text', 'chat', 'post', 'social media', 'app',
      'application', 'file', 'folder', 'document', 'download', 'upload', 'click', 'search', 'link',
      'password', 'account', 'user', 'virtual', 'wi-fi', 'wifi', 'phone', 'telephone', 'mobile',
      'cellphone', 'smartphone', 'call', 'video', 'audio', 'record', 'invent', 'invention',
      'inventor', 'discover', 'discovery', 'experiment', 'laboratory', 'lab', 'research', 'theory',
      'method', 'process', 'analysis', 'analyse', 'analyze', 'formula', 'element', 'chemical',
      'chemistry', 'physics', 'physical', 'biology', 'biological', 'nuclear', 'atomic', 'atom',
      'radiation', 'gravity', 'magnet', 'laser', 'engine', 'motor', 'fuel', 'gas', 'oil', 'steam',
      'automatic', 'automatically', 'function', 'operate', 'operation', 'control', 'connect', 'connection'
    ]),
    viKeywords: [
      'khoa học', 'nhà khoa học', 'công nghệ', 'kỹ thuật', 'kỹ sư', 'máy móc', 'thiết bị', 'dụng cụ',
      'hệ thống', 'mạng lưới', 'máy tính', 'màn hình', 'bàn phím', 'máy in', 'phần cứng', 'phần mềm',
      'dữ liệu', 'cơ sở dữ liệu', 'kỹ thuật số', 'điện tử', 'điện năng', 'dòng điện', 'cục pin',
      'dây cáp', 'công tắc', 'tín hiệu', 'vệ tinh', 'trí tuệ nhân tạo', 'mạng internet', 'trang web',
      'trực tuyến', 'thư điện tử', 'tin nhắn', 'ứng dụng', 'tập tin', 'thư mục', 'tài liệu',
      'tải xuống', 'tải lên', 'mật khẩu', 'người dùng', 'điện thoại', 'di động', 'phát minh',
      'nhà phát minh', 'khám phá', 'thí nghiệm', 'lý thuyết', 'phương pháp', 'phân tích', 'hóa chất',
      'hạt nhân', 'nguyên tử', 'bức xạ', 'trọng lực', 'động cơ', 'tự động', 'vận hành', 'kết nối'
    ]
  },
  {
    id: 'society_law_politics',
    title: '⚖️ Xã hội, Luật pháp & Chính trị',
    enWords: new Set([
      'society', 'social', 'community', 'public', 'citizen', 'civil', 'population', 'culture',
      'cultural', 'tradition', 'traditional', 'custom', 'religion', 'religious', 'belief', 'faith',
      'god', 'holy', 'spiritual', 'moral', 'ethics', 'ethical', 'politics', 'political', 'politician',
      'government', 'govern', 'governor', 'state', 'nation', 'national', 'international', 'global',
      'country', 'parliament', 'congress', 'senate', 'ministry', 'minister', 'prime minister',
      'president', 'king', 'queen', 'prince', 'princess', 'royal', 'lord', 'empire', 'emperor',
      'democracy', 'democratic', 'republic', 'election', 'elect', 'vote', 'voter', 'campaign',
      'party', 'policy', 'reform', 'authority', 'power', 'official', 'rule', 'regulation', 'law',
      'legal', 'illegal', 'lawyer', 'attorney', 'court', 'judge', 'jury', 'trial', 'case', 'justice',
      'fair', 'unfair', 'right', 'human rights', 'freedom', 'liberty', 'equal', 'equality',
      'crime', 'criminal', 'offence', 'offense', 'commit', 'guilty', 'innocent', 'victim', 'witness',
      'suspect', 'evidence', 'proof', 'prove', 'police', 'policeman', 'officer', 'detective',
      'arrest', 'prison', 'prisoner', 'jail', 'cell', 'punish', 'punishment', 'fine', 'sentence',
      'steal', 'theft', 'thief', 'rob', 'robbery', 'murder', 'kill', 'attack', 'violence', 'violent',
      'weapon', 'gun', 'shoot', 'bomb', 'war', 'peace', 'peaceful', 'army', 'military', 'soldier',
      'troop', 'navy', 'air force', 'battle', 'fight', 'conflict', 'enemy', 'ally', 'defend',
      'defense', 'defence', 'protect', 'protection', 'security', 'safe', 'safety', 'danger',
      'dangerous', 'threat', 'threaten', 'risk', 'rescue', 'charity', 'volunteer', 'protest', 'issue'
    ]),
    viKeywords: [
      'xã hội', 'cộng đồng', 'công chúng', 'công dân', 'dân số', 'văn hóa', 'truyền thống',
      'phong tục', 'tôn giáo', 'tín ngưỡng', 'đức tin', 'thần thánh', 'đạo đức', 'chính trị',
      'chính trị gia', 'chính phủ', 'nhà nước', 'quốc gia', 'quốc tế', 'toàn cầu', 'quốc hội',
      'bộ trưởng', 'thủ tướng', 'tổng thống', 'nhà vua', 'nữ hoàng', 'hoàng tử', 'công chúa',
      'hoàng gia', 'đế chế', 'dân chủ', 'cộng hòa', 'bầu cử', 'bỏ phiếu', 'cử tri', 'chiến dịch',
      'chính sách', 'cải cách', 'chính quyền', 'quy định', 'luật pháp', 'pháp luật', 'hợp pháp',
      'bất hợp pháp', 'luật sư', 'tòa án', 'thẩm phán', 'bồi thẩm đoàn', 'phiên tòa', 'công lý',
      'công bằng', 'nhân quyền', 'tự do', 'bình đẳng', 'tội phạm', 'tội ác', 'phạm tội', 'có tội',
      'vô tội', 'nạn nhân', 'nhân chứng', 'nghi phạm', 'bằng chứng', 'cảnh sát', 'bắt giữ', 'nhà tù',
      'tù nhân', 'trừng phạt', 'hình phạt', 'ăn cắp', 'kẻ trộm', 'cướp', 'giết người', 'bạo lực',
      'vũ khí', 'súng', 'bom', 'chiến tranh', 'hòa bình', 'quân đội', 'quân sự', 'người lính',
      'trận chiến', 'xung đột', 'kẻ thù', 'đồng minh', 'bảo vệ', 'an ninh', 'an toàn', 'nguy hiểm',
      'đe dọa', 'rủi ro', 'từ thiện', 'tình nguyện', 'biểu tình'
    ]
  },
  {
    id: 'feelings_mind',
    title: '😊 Cảm xúc, Tính cách & Tư duy',
    enWords: new Set([
      'feel', 'feeling', 'emotion', 'emotional', 'mood', 'attitude', 'character', 'personality',
      'mind', 'mental', 'thought', 'think', 'idea', 'opinion', 'view', 'belief', 'believe',
      'imagine', 'imagination', 'memory', 'remember', 'remind', 'forget', 'understand', 'realize',
      'realise', 'recognize', 'recognise', 'know', 'knowledge', 'wonder', 'doubt', 'suspect',
      'expect', 'expectation', 'hope', 'wish', 'desire', 'prefer', 'preference', 'intend',
      'intention', 'decide', 'decision', 'choose', 'choice', 'concentrate', 'concentration', 'focus',
      'attention', 'notice', 'ignore', 'consider', 'judge', 'guess', 'suppose', 'assume',
      'happy', 'happiness', 'unhappy', 'glad', 'pleased', 'pleasure', 'pleasant', 'enjoy',
      'enjoyable', 'delighted', 'cheerful', 'excited', 'exciting', 'excitement', 'enthusiastic',
      'enthusiasm', 'proud', 'pride', 'confident', 'confidence', 'satisfied', 'satisfaction',
      'relief', 'relieved', 'grateful', 'thankful', 'sad', 'sadness', 'upset', 'depressed',
      'depression', 'miserable', 'disappointed', 'disappointment', 'disappointing', 'lonely',
      'bored', 'boring', 'tired', 'afraid', 'scared', 'scary', 'frightened', 'frightening', 'fear',
      'terrified', 'panic', 'horror', 'nervous', 'anxious', 'anxiety', 'worry', 'worried', 'stress',
      'stressed', 'angry', 'anger', 'mad', 'annoy', 'annoyed', 'annoying', 'upset', 'furious',
      'hate', 'hatred', 'jealous', 'embarrassed', 'embarrassing', 'ashamed', 'shame', 'guilty',
      'surprise', 'surprised', 'surprising', 'shock', 'shocked', 'shocking', 'amazed', 'amazing',
      'confused', 'confusing', 'confusion', 'curious', 'interested', 'interesting', 'keen', 'fond',
      'kind', 'unkind', 'nice', 'friendly', 'unfriendly', 'polite', 'impolite', 'rude', 'honest',
      'dishonest', 'sincere', 'loyal', 'generous', 'mean', 'selfish', 'patient', 'impatient',
      'calm', 'quiet', 'shy', 'brave', 'courage', 'clever', 'smart', 'intelligent', 'intelligence',
      'bright', 'wise', 'sensible', 'reasonable', 'silly', 'stupid', 'fool', 'foolish', 'crazy',
      'mad', 'lazy', 'hard-working', 'serious', 'strict', 'gentle', 'cruel', 'aggressive', 'ambitious'
    ]),
    viKeywords: [
      'cảm giác', 'cảm xúc', 'tâm trạng', 'thái độ', 'tính cách', 'nhân cách', 'tâm trí', 'tinh thần',
      'suy nghĩ', 'ý tưởng', 'ý kiến', 'quan điểm', 'tưởng tượng', 'trí nhớ', 'ghi nhớ', 'nhắc nhở',
      'quên', 'hiểu', 'nhận ra', 'nghi ngờ', 'hy vọng', 'mong muốn', 'ưa thích', 'ý định', 'quyết định',
      'lựa chọn', 'tập trung', 'chú ý', 'cân nhắc', 'phỏng đoán', 'giả sử', 'hạnh phúc', 'vui vẻ',
      'hài lòng', 'niềm vui', 'thích thú', 'hào hứng', 'phấn khích', 'nhiệt tình', 'tự hào', 'tự tin',
      'nhẹ nhõm', 'biết ơn', 'buồn bã', 'nỗi buồn', 'chán nản', 'trầm cảm', 'thất vọng', 'cô đơn',
      'buồn chán', 'nhàm chán', 'sợ hãi', 'nỗi sợ', 'hoảng loạn', 'lo lắng', 'bồn chồn', 'tức giận',
      'cơn giận', 'khó chịu', 'bực mình', 'căm ghét', 'ghen tị', 'xấu hổ', 'ngượng ngùng', 'ngạc nhiên',
      'bất ngờ', 'kinh ngạc', 'bối rối', 'tò mò', 'quan tâm', 'tốt bụng', 'thân thiện', 'lịch sự',
      'bất lịch sự', 'thô lỗ', 'trung thực', 'thật thà', 'chân thành', 'hào phóng', 'ích kỷ',
      'kiên nhẫn', 'bình tĩnh', 'nhút nhát', 'dũng cảm', 'can đảm', 'thông minh', 'khôn ngoan',
      'ngốc nghếch', 'ngu ngốc', 'điên rồ', 'lười biếng', 'chăm chỉ', 'nghiêm túc', 'nghiêm khắc',
      'dịu dàng', 'độc ác', 'hung hăng', 'tham vọng'
    ]
  },
  {
    id: 'time_numbers_colors',
    title: '⏰ Thời gian, Số đếm, Màu sắc & Đo lường',
    enWords: new Set([
      'time', 'second', 'minute', 'hour', 'o’clock', "o'clock", 'day', 'daily', 'morning', 'noon',
      'afternoon', 'evening', 'night', 'midnight', 'tonight', 'today', 'tomorrow', 'yesterday',
      'week', 'weekend', 'weekly', 'month', 'monthly', 'year', 'annual', 'annually', 'decade',
      'century', 'era', 'period', 'moment', 'while', 'date', 'calendar', 'schedule', 'timetable',
      'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'january',
      'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october',
      'november', 'december', 'past', 'present', 'future', 'ancient', 'modern', 'recent', 'recently',
      'current', 'currently', 'early', 'late', 'soon', 'immediately', 'suddenly', 'gradually',
      'eventually', 'finally', 'first', 'last', 'next', 'previous', 'following', 'always', 'usually',
      'often', 'frequently', 'sometimes', 'occasionally', 'rarely', 'seldom', 'never', 'ever',
      'already', 'yet', 'still', 'just', 'ago', 'during', 'since', 'until', 'till', 'before', 'after',
      'number', 'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
      'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
      'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
      'hundred', 'thousand', 'million', 'billion', 'first', 'second', 'third', 'fourth', 'fifth',
      'half', 'quarter', 'double', 'twice', 'once', 'pair', 'couple', 'dozen', 'percent', 'per cent',
      'percentage', 'average', 'total', 'amount', 'quantity', 'count', 'calculate', 'measure',
      'measurement', 'unit', 'size', 'length', 'long', 'short', 'width', 'wide', 'narrow', 'height',
      'high', 'tall', 'low', 'depth', 'deep', 'shallow', 'thick', 'thin', 'weight', 'weigh', 'heavy',
      'light', 'gram', 'kilogram', 'kilo', 'pound', 'ton', 'metre', 'meter', 'kilometre', 'kilometer',
      'centimetre', 'centimeter', 'millimetre', 'inch', 'foot', 'mile', 'litre', 'liter', 'pint',
      'speed', 'fast', 'quick', 'slow', 'rate', 'level', 'scale', 'degree', 'shape', 'circle',
      'round', 'square', 'triangle', 'line', 'straight', 'curve', 'curved', 'flat', 'angle', 'point',
      'colour', 'color', 'coloured', 'colorful', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
      'pink', 'brown', 'black', 'white', 'grey', 'gray', 'silver', 'golden', 'bright', 'dark', 'pale', 'light'
    ]),
    viKeywords: [
      'thời gian', 'giây', 'phút', 'giờ', 'buổi sáng', 'buổi trưa', 'buổi chiều', 'buổi tối',
      'ban đêm', 'nửa đêm', 'hôm nay', 'ngày mai', 'hôm qua', 'tuần', 'cuối tuần', 'tháng', 'năm',
      'thập kỷ', 'thế kỷ', 'thời đại', 'khoảnh khắc', 'lịch', 'thời khóa biểu', 'thứ hai', 'thứ ba',
      'thứ tư', 'thứ năm', 'thứ sáu', 'thứ bảy', 'chủ nhật', 'tháng một', 'tháng hai', 'tháng ba',
      'tháng tư', 'tháng năm', 'tháng sáu', 'tháng bảy', 'tháng tám', 'tháng chín', 'tháng mười',
      'quá khứ', 'hiện tại', 'tương lai', 'cổ đại', 'hiện đại', 'gần đây', 'sớm', 'muộn', 'ngay lập tức',
      'đột nhiên', 'cuối cùng', 'luôn luôn', 'thường xuyên', 'thỉnh thoảng', 'hiếm khi', 'không bao giờ',
      'con số', 'một nửa', 'phần tư', 'gấp đôi', 'phần trăm', 'trung bình', 'tổng cộng', 'số lượng',
      'kích thước', 'chiều dài', 'chiều rộng', 'chiều cao', 'chiều sâu', 'trọng lượng', 'cân nặng',
      'ki-lô-gam', 'mét', 'ki-lô-mét', 'tốc độ', 'hình dạng', 'hình tròn', 'hình vuông', 'tam giác',
      'đường thẳng', 'màu sắc', 'màu đỏ', 'màu xanh', 'màu vàng', 'màu tím', 'màu hồng', 'màu nâu',
      'màu đen', 'màu trắng', 'màu xám'
    ]
  }
];

/**
 * Hàm phân loại 1 thẻ từ vựng vào đúng 1 trong 16 Chủ đề Ngữ nghĩa
 */
function classifyCardTopic(card) {
  const cleanWord = String(card.word || '')
    .split(',')[0]
    .replace(/™/g, '')
    .replace(/’/g, "'")
    .trim()
    .toLowerCase();

  const fullWordLower = String(card.word || '').trim().toLowerCase();
  const meaningLower = String(card.meaning_vi || '').trim().toLowerCase();
  const posLower = String(card.part_of_speech || '').trim().toLowerCase();

  // Bước 1: Kiểm tra khớp trực tiếp từ khóa tiếng Anh (enWords) trong 13 chủ đề chuyên biệt
  for (let i = 0; i < TOPICS.length; i++) {
    const topic = TOPICS[i];
    if (topic.enWords.has(cleanWord) || topic.enWords.has(fullWordLower)) {
      return topic;
    }
  }

  // Bước 2: Kiểm tra nếu từ loại làSố đếm (number) -> Đưa vào Chủ đề Thời gian & Số đếm
  if (posLower.includes('number')) {
    return TOPICS.find((t) => t.id === 'time_numbers_colors');
  }

  // Bước 3: Kiểm tra từ khóa trong nghĩa tiếng Việt (viKeywords) của 13 chủ đề chuyên biệt
  for (let i = 0; i < TOPICS.length; i++) {
    const topic = TOPICS[i];
    for (let j = 0; j < topic.viKeywords.length; j++) {
      const kw = topic.viKeywords[j];
      if (meaningLower === kw || meaningLower.includes(kw)) {
        return topic;
      }
    }
  }

  // Bước 4: Nhóm 16 - Từ nối, Giới từ, Đại từ, Hạn định từ & Trợ động từ (Cấu trúc câu)
  const grammarTokens = ['prep.', 'conj.', 'pron.', 'det.', 'exclam.', 'modal v.', 'auxiliary v.'];
  const isGrammarOnly =
    grammarTokens.some((g) => posLower.includes(g)) &&
    !posLower.includes('n.') &&
    !posLower.includes('adj.');

  if (isGrammarOnly) {
    return {
      id: 'grammar_connectors',
      title: '🔗 Từ nối, Giới từ & Cấu trúc câu'
    };
  }

  // Bước 5: Nhóm 14 - Hành động & Giao tiếp thông dụng (Dành cho các động từ v. đa dụng)
  if (posLower.includes('v.')) {
    return {
      id: 'common_actions',
      title: '🏃 Hành động & Giao tiếp thông dụng'
    };
  }

  // Bước 6: Nhóm 15 - Tính chất, Trạng thái & Đánh giá (Dành cho tính từ adj., trạng từ adv. và danh từ trừu tượng chung)
  return {
    id: 'qualities_descriptions',
    title: '✨ Tính chất, Trạng thái & Đánh giá'
  };
}

/**
 * Thứ tự hiển thị cố định của 16 Chủ đề trong mỗi cấp độ (A1, A2, B1, B2)
 */
const TOPIC_ORDER = [
  'family_people',
  'home_daily',
  'food_drink',
  'travel_transport',
  'work_business',
  'education_language',
  'body_health',
  'nature_weather',
  'media_arts_sports',
  'science_tech',
  'society_law_politics',
  'feelings_mind',
  'time_numbers_colors',
  'common_actions',
  'qualities_descriptions',
  'grammar_connectors'
];

/**
 * Hàm chia danh sách thẻ của 1 Chủ đề thành các Unit (~20 từ/Unit):
 * - Nếu tổng số từ <= 25: Giữ nguyên 1 Unit
 * - Nếu tổng số từ > 25: Chia đều thành các Phần (Phần 1, Phần 2...) khoảng 18 - 22 từ/Unit
 */
function splitTopicCardsIntoUnits(topicTitle, cards) {
  if (cards.length <= 25) {
    return [
      {
        unitTitle: topicTitle,
        cards: cards
      }
    ];
  }

  const numParts = Math.ceil(cards.length / 20);
  const chunkSize = Math.ceil(cards.length / numParts);
  const resultUnits = [];

  for (let p = 0; p < numParts; p++) {
    const slice = cards.slice(p * chunkSize, (p + 1) * chunkSize);
    if (slice.length > 0) {
      resultUnits.push({
        unitTitle: `${topicTitle} (Phần ${p + 1})`,
        cards: slice
      });
    }
  }

  return resultUnits;
}

/**
 * Hàm cập nhật lại 3 đáp án nhiễu (distractors) cho mỗi từ từ chính các từ cùng Chủ đề
 */
function updateSameTopicDistractors(topicCards) {
  if (topicCards.length < 4) {
    return;
  }

  for (let i = 0; i < topicCards.length; i++) {
    const currentCard = topicCards[i];
    const distractors = [];

    // Lấy 3 từ khác trong cùng chủ đề (cách đều nhau để đa dạng)
    let step = 1;
    while (distractors.length < 3 && step < topicCards.length) {
      const candidate = topicCards[(i + step * 3) % topicCards.length];
      if (
        candidate.word !== currentCard.word &&
        candidate.meaning_vi !== currentCard.meaning_vi &&
        !distractors.some((d) => d.word === candidate.word)
      ) {
        distractors.push({
          word: candidate.word,
          meaning_vi: candidate.meaning_vi,
          phonetic: candidate.phonetic_primary || null
        });
      }
      step++;
    }

    if (distractors.length === 3) {
      currentCard.distractors = distractors;
    }
  }
}

function runRegroupByTopic() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error('❌ Không tìm thấy file:', DATA_FILE);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  let grandTotalCards = 0;
  let grandTotalUnits = 0;

  // Duyệt qua từng cấp độ (A1, A2, B1, B2)
  for (let l = 0; l < rawData.levels.length; l++) {
    const levelObj = rawData.levels[l];

    for (let d = 0; d < levelObj.decks.length; d++) {
      const deck = levelObj.decks[d];

      // 1. Gom tất cả các thẻ hiện có trong bộ thẻ này lại
      const allDeckCards = [];
      for (let u = 0; u < deck.units.length; u++) {
        const unit = deck.units[u];
        for (let c = 0; c < unit.cards.length; c++) {
          allDeckCards.push(unit.cards[c]);
        }
      }

      // 2. Phân loại từng thẻ vào 16 Chủ đề
      const topicBuckets = new Map();
      const topicTitles = new Map();

      for (let i = 0; i < allDeckCards.length; i++) {
        const card = allDeckCards[i];
        const topic = classifyCardTopic(card);

        if (!topicBuckets.has(topic.id)) {
          topicBuckets.set(topic.id, []);
          topicTitles.set(topic.id, topic.title);
        }
        topicBuckets.get(topic.id).push(card);
      }

      // 3. Tạo danh sách Units mới theo đúng thứ tự 16 Chủ đề
      const newUnits = [];
      let nextUnitNumber = 1;

      for (let t = 0; t < TOPIC_ORDER.length; t++) {
        const topicId = TOPIC_ORDER[t];
        const cardsInTopic = topicBuckets.get(topicId) || [];

        if (cardsInTopic.length === 0) {
          continue;
        }

        // Sắp xếp A-Z nhẹ nhàng bên trong từng Chủ đề để người học dễ dò
        cardsInTopic.sort((a, b) =>
          String(a.word || '').localeCompare(String(b.word || ''), 'en', { sensitivity: 'base' })
        );

        // Cập nhật 3 đáp án nhiễu (distractors) cùng chủ đề
        updateSameTopicDistractors(cardsInTopic);

        // Chia chủ đề thành các Unit (~20 từ/Unit)
        const topicTitle = topicTitles.get(topicId);
        const splitUnits = splitTopicCardsIntoUnits(topicTitle, cardsInTopic);

        for (let s = 0; s < splitUnits.length; s++) {
          const uItem = splitUnits[s];
          const unitCards = uItem.cards;

          // Đánh lại order_index 1..N trong từng Unit
          for (let idx = 0; idx < unitCards.length; idx++) {
            unitCards[idx].order_index = idx + 1;
          }

          newUnits.push({
            unit_number: nextUnitNumber,
            title: `Unit ${nextUnitNumber}: ${uItem.unitTitle}`,
            card_count: unitCards.length,
            cards: unitCards
          });

          nextUnitNumber++;
        }
      }

      // 4. Cập nhật lại thông tin của Bộ thẻ
      deck.units = newUnits;
      deck.total_units = newUnits.length;
      deck.total_cards = allDeckCards.length;
      levelObj.total_words_in_level = allDeckCards.length;

      grandTotalCards += allDeckCards.length;
      grandTotalUnits += newUnits.length;

      console.log(
        `✅ Cấp độ ${deck.level_tag}: Đã gom ${allDeckCards.length} từ vào ${newUnits.length} Units theo Chủ đề.`
      );
    }
  }

  // Cập nhật thông tin tổng của file JSON
  rawData.total_unique_entries = grandTotalCards;
  rawData.organization_rule =
    'Phân tầng theo 4 cấp độ CEFR (A1, A2, B1, B2) -> Gom nhóm theo 16 Chủ đề Ngữ nghĩa (Thematic Units ~20 từ/Unit)';

  fs.writeFileSync(DATA_FILE, JSON.stringify(rawData, null, 2), 'utf-8');
  console.log('\n==================================================');
  console.log(
    `🎉 HOÀN TẤT GOM NHÓM CHỦ ĐỀ CHO ${grandTotalCards} TỪ (${grandTotalUnits} UNITS)!`
  );
  console.log('==================================================');
}

runRegroupByTopic();
