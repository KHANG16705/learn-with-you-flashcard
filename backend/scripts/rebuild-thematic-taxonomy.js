import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data', 'oxford_3000_structured_4tiers.json');

/**
 * 5 NHÓM CHỦ ĐỀ LỚN (MACRO CATEGORIES) CHUẨN SƯ PHẠM EDTECH
 */
const MACRO_CATEGORIES = {
  LIFE_PEOPLE: {
    id: 'life_people',
    name: 'Đời sống & Gia đình',
    order: 1
  },
  TRAVEL_LEISURE: {
    id: 'travel_leisure',
    name: 'Du lịch & Giải trí',
    order: 2
  },
  WORK_EDUCATION: {
    id: 'work_education',
    name: 'Học tập & Công việc',
    order: 3
  },
  NATURE_SCIENCE_SOCIETY: {
    id: 'nature_science_society',
    name: 'Thiên nhiên & Xã hội',
    order: 4
  },
  MIND_ACTIONS_GRAMMAR: {
    id: 'mind_actions_grammar',
    name: 'Giao tiếp & Ngữ pháp',
    order: 5
  }
};

/**
 * DANH SÁCH CHỦ ĐỀ CHI TIẾT (SUB-TOPICS) GẮN VỚI 5 NHÓM CHỦ ĐỀ LỚN
 * Đặt tên ngắn gọn (2-3 từ), tự nhiên theo đúng chuẩn Parroto.
 */
const SUB_TOPICS = [
  // ================= NHÓM 1: ĐỜI SỐNG & GIA ĐÌNH =================
  {
    id: 'family_relationships',
    category: MACRO_CATEGORIES.LIFE_PEOPLE,
    title: 'Gia đình & Người thân',
    unitTitles: ['Gia đình & Người thân', 'Con người & Bạn bè', 'Mối quan hệ xã hội'],
    enWords: new Set([
      'family', 'father', 'dad', 'mother', 'mum', 'mom', 'parent', 'parents', 'son', 'daughter',
      'brother', 'sister', 'husband', 'wife', 'child', 'children', 'baby', 'boy', 'girl', 'man',
      'men', 'woman', 'women', 'person', 'people', 'adult', 'teenager', 'youth', 'grandfather',
      'grandmother', 'grandparent', 'grandson', 'granddaughter', 'grandchild', 'uncle', 'aunt',
      'cousin', 'nephew', 'niece', 'friend', 'friendship', 'boyfriend', 'girlfriend', 'partner',
      'couple', 'marriage', 'marry', 'married', 'wedding', 'bride', 'divorce', 'single', 'relative',
      'relationship', 'neighbour', 'neighbor', 'neighborhood', 'guest', 'visitor', 'host', 'member',
      'generation', 'human', 'gentleman', 'lady', 'guy', 'kid', 'twin', 'ancestor', 'birth', 'born',
      'age', 'elderly', 'male', 'female', 'name', 'surname', 'miss', 'mr', 'mrs', 'ms', 'date',
      'hug', 'kiss', 'companion', 'acquaintance', 'pregnant', 'pregnancy'
    ]),
    viPhrases: [
      'gia đình', 'cha mẹ', 'bố mẹ', 'con trai', 'con gái', 'anh trai', 'em trai', 'chị gái',
      'em gái', 'vợ chồng', 'em bé', 'đứa trẻ', 'trẻ em', 'người lớn', 'thanh thiếu niên',
      'ông bà', 'cháu trai', 'cháu gái', 'anh chị em họ', 'tình bạn', 'bạn trai', 'bạn gái',
      'kết hôn', 'đám cưới', 'cô dâu', 'chú rể', 'ly hôn', 'họ hàng', 'mối quan hệ', 'hàng xóm',
      'thế hệ', 'con người', 'đàn ông', 'phụ nữ', 'quý ông', 'quý bà'
    ]
  },
  {
    id: 'home_furniture',
    category: MACRO_CATEGORIES.LIFE_PEOPLE,
    title: 'Nhà cửa & Nội thất',
    unitTitles: ['Nhà cửa & Phòng ốc', 'Nội thất & Đồ gia dụng', 'Sinh hoạt trong nhà'],
    enWords: new Set([
      'home', 'house', 'housing', 'flat', 'apartment', 'accommodation', 'building', 'room',
      'bedroom', 'bathroom', 'kitchen', 'living room', 'garden', 'yard', 'garage', 'hall',
      'corridor', 'floor', 'wall', 'ceiling', 'roof', 'door', 'gate', 'window', 'stairs', 'step',
      'lift', 'elevator', 'furniture', 'table', 'chair', 'desk', 'sofa', 'couch', 'bed', 'sheet',
      'blanket', 'pillow', 'carpet', 'rug', 'curtain', 'mirror', 'lamp', 'clock', 'shelf',
      'cupboard', 'wardrobe', 'drawer', 'box', 'basket', 'container', 'key', 'lock', 'bell',
      'rubbish', 'trash', 'garbage', 'bin', 'clean', 'wash', 'sweep', 'tidy', 'dirty', 'mess',
      'soap', 'towel', 'brush', 'comb', 'toothbrush', 'shower', 'bath', 'toilet', 'sink', 'tap',
      'pipe', 'heater', 'heating', 'air conditioning', 'fan', 'washing machine', 'tool', 'hammer',
      'nail', 'rope', 'string', 'chain', 'toy', 'umbrella', 'household', 'domestic', 'rent'
    ]),
    viPhrases: [
      'ngôi nhà', 'nhà ở', 'căn hộ', 'chỗ ở', 'phòng ngủ', 'phòng tắm', 'nhà bếp', 'phòng khách',
      'khu vườn', 'sàn nhà', 'bức tường', 'trần nhà', 'mái nhà', 'cánh cửa', 'cửa sổ', 'cầu thang',
      'thang máy', 'nội thất', 'cái bàn', 'cái ghế', 'ghế sofa', 'cái giường', 'chăn gối', 'rèm cửa',
      'tủ quần áo', 'ngăn kéo', 'chìa khóa', 'ổ khóa', 'thùng rác', 'dọn dẹp', 'xà phòng',
      'khăn tắm', 'bàn chải', 'vòi sen', 'bồn tắm', 'nhà vệ sinh', 'máy giặt', 'cái búa'
    ]
  },
  {
    id: 'clothing_materials',
    category: MACRO_CATEGORIES.LIFE_PEOPLE,
    title: 'Quần áo & Thời trang',
    unitTitles: ['Quần áo & Trang phục', 'Phụ kiện & Chất liệu', 'Thời trang & Phong cách'],
    enWords: new Set([
      'clothes', 'clothing', 'cloth', 'shirt', 't-shirt', 'trousers', 'pants', 'jeans', 'shorts',
      'skirt', 'dress', 'suit', 'coat', 'jacket', 'sweater', 'jumper', 'hat', 'cap', 'shoe',
      'boot', 'trainer', 'sock', 'glove', 'scarf', 'tie', 'belt', 'pocket', 'button', 'collar',
      'sleeve', 'underwear', 'uniform', 'wear', 'dressed', 'undressed', 'fashion', 'fashionable',
      'style', 'stylish', 'watch', 'glasses', 'purse', 'wallet', 'bag', 'handbag', 'ring',
      'jewellery', 'jewelry', 'necklace', 'cotton', 'wool', 'leather', 'silk', 'fur', 'plastic',
      'wooden', 'metal', 'steel', 'silver', 'gold', 'golden', 'paper', 'cardboard', 'brick',
      'rubber', 'fabric', 'material', 'substance'
    ]),
    viPhrases: [
      'quần áo', 'trang phục', 'áo sơ mi', 'áo thun', 'quần dài', 'quần bò', 'chân váy',
      'áo khoác', 'áo len', 'đôi giày', 'đôi tất', 'găng tay', 'khăn quàng', 'cà vạt', 'thắt lưng',
      'túi áo', 'cúc áo', 'cổ áo', 'tay áo', 'đồng phục', 'thời trang', 'kính mắt', 'ví tiền',
      'trang sức', 'vải bông', 'len', 'da thuộc', 'lụa', 'kim loại', 'thủy tinh', 'cao su', 'vật liệu'
    ]
  },
  {
    id: 'food_cooking',
    category: MACRO_CATEGORIES.LIFE_PEOPLE,
    title: 'Đồ ăn & Thức uống',
    unitTitles: ['Đồ ăn & Thực phẩm', 'Đồ uống & Trái cây', 'Nấu ăn & Nhà hàng', 'Hương vị & Bữa ăn'],
    enWords: new Set([
      'food', 'eat', 'drink', 'meal', 'breakfast', 'lunch', 'dinner', 'snack', 'feast', 'water',
      'milk', 'tea', 'coffee', 'juice', 'beer', 'wine', 'alcohol', 'alcoholic', 'bread', 'butter',
      'cheese', 'rice', 'meat', 'beef', 'pork', 'chicken', 'lamb', 'fish', 'seafood', 'egg',
      'soup', 'salad', 'sandwich', 'pizza', 'pasta', 'pie', 'cake', 'chocolate', 'biscuit',
      'cookie', 'sweet', 'candy', 'dessert', 'ice cream', 'sugar', 'salt', 'pepper', 'oil',
      'flour', 'sauce', 'spice', 'spicy', 'fruit', 'apple', 'banana', 'orange', 'lemon',
      'strawberry', 'grape', 'vegetable', 'potato', 'tomato', 'onion', 'garlic', 'carrot', 'bean',
      'pea', 'corn', 'nut', 'seed', 'vitamin', 'protein', 'diet', 'cook', 'cooking', 'cooker',
      'bake', 'boil', 'fry', 'roast', 'grill', 'burn', 'pour', 'mix', 'stir', 'chop', 'slice',
      'taste', 'tasty', 'delicious', 'flavour', 'flavor', 'sour', 'bitter', 'salty', 'fresh',
      'raw', 'frozen', 'hungry', 'hunger', 'thirsty', 'thirst', 'starve', 'menu', 'restaurant',
      'cafe', 'pub', 'waiter', 'waitress', 'chef', 'dish', 'plate', 'bowl', 'cup', 'mug',
      'bottle', 'fork', 'knife', 'spoon', 'pan', 'pot', 'oven', 'fridge', 'freezer', 'kettle',
      'recipe', 'ingredient', 'feed', 'bite', 'chew', 'swallow'
    ]),
    viPhrases: [
      'thức ăn', 'đồ ăn', 'thức uống', 'đồ uống', 'bữa ăn', 'bữa sáng', 'bữa trưa', 'bữa tối',
      'nước ép', 'rượu vang', 'bánh mì', 'phô mai', 'thịt bò', 'thịt lợn', 'thịt gà', 'hải sản',
      'bánh ngọt', 'bánh quy', 'sô cô la', 'trái cây', 'hoa quả', 'quả táo', 'quả chuối', 'quả cam',
      'quả chanh', 'dâu tây', 'rau củ', 'khoai tây', 'cà chua', 'hành tây', 'cà rốt', 'hạt đậu',
      'nấu ăn', 'lò nướng', 'tủ lạnh', 'thực đơn', 'nhà hàng', 'quán cà phê', 'bồi bàn', 'đầu bếp',
      'món ăn', 'công thức nấu', 'nguyên liệu', 'gia vị'
    ]
  },

  // ================= NHÓM 2: DI CHUYỂN, ĐỊA ĐIỂM & GIẢI TRÍ =================
  {
    id: 'travel_transport',
    category: MACRO_CATEGORIES.TRAVEL_LEISURE,
    title: 'Du lịch & Giao thông',
    unitTitles: ['Du lịch & Kỳ nghỉ', 'Phương tiện giao thông', 'Đường phố & Đi lại', 'Hành trình & Chuyến bay'],
    enWords: new Set([
      'travel', 'traveller', 'traveler', 'trip', 'journey', 'tour', 'tourism', 'tourist',
      'holiday', 'vacation', 'expedition', 'voyage', 'cruise', 'flight', 'fly', 'plane',
      'airplane', 'aircraft', 'helicopter', 'airport', 'airline', 'pilot', 'crew', 'passenger',
      'passport', 'visa', 'ticket', 'fare', 'luggage', 'baggage', 'suitcase', 'hotel', 'hostel',
      'motel', 'reception', 'reservation', 'reserve', 'camp', 'camping', 'tent', 'cabin',
      'map', 'guide', 'guidebook', 'destination', 'sightseeing', 'souvenir', 'abroad', 'overseas',
      'foreign', 'foreigner', 'transport', 'transportation', 'traffic', 'vehicle', 'car', 'bus',
      'coach', 'train', 'railway', 'rail', 'railroad', 'underground', 'subway', 'metro', 'tram',
      'taxi', 'cab', 'truck', 'lorry', 'van', 'ambulance', 'bike', 'bicycle', 'cycle', 'cyclist',
      'motorcycle', 'motorbike', 'scooter', 'boat', 'ship', 'ferry', 'yacht', 'sail', 'sailor',
      'port', 'harbour', 'harbor', 'station', 'platform', 'terminal', 'road', 'street', 'avenue',
      'highway', 'motorway', 'freeway', 'path', 'lane', 'pavement', 'sidewalk', 'bridge', 'tunnel',
      'crossing', 'crossroads', 'junction', 'roundabout', 'parking', 'petrol', 'gasoline', 'fuel',
      'engine', 'motor', 'tyre', 'tire', 'wheel', 'brake', 'gear', 'seatbelt', 'boot', 'trunk',
      'drive', 'driver', 'ride', 'rider', 'steer', 'speed', 'crash', 'accident', 'delay', 'cancel',
      'arrive', 'arrival', 'depart', 'departure', 'board', 'land', 'landing', 'launch', 'route'
    ]),
    viPhrases: [
      'du lịch', 'chuyến đi', 'hành trình', 'du khách', 'kỳ nghỉ', 'chuyến bay', 'máy bay',
      'sân bay', 'hãng hàng không', 'phi công', 'hành khách', 'hộ chiếu', 'hành lý', 'khách sạn',
      'cắm trại', 'hướng dẫn viên', 'điểm đến', 'nước ngoài', 'giao thông', 'phương tiện',
      'xe hơi', 'ô tô', 'xe buýt', 'tàu hỏa', 'đường sắt', 'tàu điện ngầm', 'xe tải', 'xe đạp',
      'xe máy', 'tàu thủy', 'bến cảng', 'nhà ga', 'đường phố', 'đại lộ', 'đường cao tốc', 'vỉa hè',
      'cây cầu', 'đường hầm', 'ngã tư', 'bãi đỗ xe', 'nhiên liệu', 'tài xế', 'khởi hành', 'lộ trình'
    ]
  },
  {
    id: 'places_geography',
    category: MACRO_CATEGORIES.TRAVEL_LEISURE,
    title: 'Địa điểm & Thành phố',
    unitTitles: ['Địa điểm & Đô thị', 'Vị trí & Phương hướng', 'Khu vực & Không gian'],
    enWords: new Set([
      'place', 'location', 'site', 'spot', 'venue', 'position', 'area', 'region', 'regional',
      'zone', 'district', 'territory', 'province', 'county', 'state', 'country', 'nation',
      'capital', 'city', 'urban', 'town', 'suburb', 'village', 'rural', 'countryside', 'downtown',
      'neighbourhood', 'centre', 'center', 'central', 'square', 'plaza', 'park', 'market', 'shop',
      'store', 'supermarket', 'mall', 'bakery', 'pharmacy', 'bank', 'post office', 'library',
      'museum', 'gallery', 'cinema', 'theatre', 'theater', 'stadium', 'gym', 'zoo', 'castle',
      'palace', 'temple', 'church', 'mosque', 'cathedral', 'monument', 'statue', 'tower',
      'skyscraper', 'fountain', 'ruin', 'embassy', 'headquarters', 'factory', 'warehouse', 'farm',
      'direction', 'north', 'south', 'east', 'west', 'northern', 'southern', 'eastern', 'western',
      'indoor', 'indoors', 'outdoor', 'outdoors', 'inside', 'outside', 'nearby', 'distance',
      'distant', 'remote', 'local', 'surround', 'surrounding', 'border', 'boundary', 'entrance', 'exit'
    ]),
    viPhrases: [
      'địa điểm', 'vị trí', 'khu vực', 'lãnh thổ', 'thành phố', 'đô thị', 'thị trấn', 'ngoại ô',
      'ngôi làng', 'nông thôn', 'thủ đô', 'quảng trường', 'công viên', 'siêu thị', 'cửa hàng',
      'bưu điện', 'thư viện', 'bảo tàng', 'rạp chiếu phim', 'nhà hát', 'sân vận động', 'lâu đài',
      'cung điện', 'ngôi đền', 'nhà thờ', 'tượng đài', 'nhà máy', 'trang trại', 'phía bắc',
      'phía nam', 'phía đông', 'phía tây', 'biên giới', 'lối vào', 'lối ra'
    ]
  },
  {
    id: 'arts_media_entertainment',
    category: MACRO_CATEGORIES.TRAVEL_LEISURE,
    title: 'Nghệ thuật & Giải trí',
    unitTitles: ['Âm nhạc & Nghệ thuật', 'Phim ảnh & Văn học', 'Báo chí & Truyền thông', 'Sự kiện & Giải trí'],
    enWords: new Set([
      'art', 'artist', 'artistic', 'artwork', 'paint', 'painter', 'painting', 'draw', 'drawing',
      'sketch', 'picture', 'photo', 'photograph', 'photographer', 'photography', 'camera',
      'image', 'portrait', 'exhibition', 'exhibit', 'sculpture', 'design', 'designer', 'craft',
      'music', 'musical', 'musician', 'song', 'sing', 'singer', 'choir', 'band', 'orchestra',
      'concert', 'opera', 'instrument', 'piano', 'guitar', 'drum', 'violin', 'flute', 'trumpet',
      'jazz', 'pop', 'rock', 'classical', 'dance', 'dancer', 'dancing', 'album', 'track', 'tune',
      'rhythm', 'melody', 'lyric', 'film', 'movie', 'actor', 'actress', 'cast', 'star', 'director',
      'producer', 'stage', 'screen', 'scene', 'script', 'plot', 'role', 'character', 'hero',
      'comedy', 'drama', 'dramatic', 'tragedy', 'horror', 'fiction', 'novel', 'novelist', 'poem',
      'poet', 'poetry', 'literature', 'literary', 'story', 'tale', 'myth', 'legend', 'chapter',
      'author', 'writer', 'perform', 'performance', 'performer', 'entertain', 'entertainment',
      'audience', 'viewer', 'listener', 'celebrity', 'famous', 'fame', 'festival', 'party',
      'anniversary', 'celebrate', 'celebration', 'ceremony', 'hobby', 'leisure', 'fun', 'funny',
      'joke', 'humour', 'humor', 'humorous', 'media', 'press', 'news', 'newspaper', 'magazine',
      'journal', 'journalism', 'journalist', 'reporter', 'columnist', 'article', 'headline',
      'editor', 'edit', 'edition', 'publish', 'publisher', 'publication', 'broadcast', 'television',
      'tv', 'radio', 'channel', 'station', 'programme', 'series', 'episode', 'show', 'commercial',
      'advert', 'advertisement', 'advertising', 'advertise', 'poster', 'podcast', 'blog', 'video'
    ]),
    viPhrases: [
      'nghệ thuật', 'nghệ sĩ', 'họa sĩ', 'bức tranh', 'nhiếp ảnh', 'máy ảnh', 'bức ảnh', 'chân dung',
      'triển lãm', 'điêu khắc', 'thiết kế', 'âm nhạc', 'nhạc sĩ', 'bài hát', 'ca sĩ', 'ban nhạc',
      'dàn nhạc', 'buổi hòa nhạc', 'nhạc cụ', 'đàn piano', 'đàn guitar', 'khiêu vũ', 'vũ công',
      'giai điệu', 'bộ phim', 'điện ảnh', 'diễn viên', 'đạo diễn', 'sân khấu', 'kịch bản', 'nhân vật',
      'hài kịch', 'bi kịch', 'tiểu thuyết', 'thơ ca', 'bài thơ', 'nhà thơ', 'văn học', 'huyền thoại',
      'biểu diễn', 'giải trí', 'khán giả', 'người nổi tiếng', 'lễ hội', 'bữa tiệc', 'lễ kỷ niệm',
      'sở thích', 'hài hước', 'truyền thông', 'báo chí', 'tin tức', 'tờ báo', 'tạp chí', 'nhà báo',
      'phóng viên', 'bài báo', 'biên tập viên', 'xuất bản', 'phát sóng', 'truyền hình', 'quảng cáo'
    ]
  },
  {
    id: 'sports_games',
    category: MACRO_CATEGORIES.TRAVEL_LEISURE,
    title: 'Thể thao & Vận động',
    unitTitles: ['Thể thao & Thi đấu', 'Trò chơi & Vận động', 'Giải đấu & Chiến thắng'],
    enWords: new Set([
      'sport', 'sports', 'athlete', 'athletic', 'athletics', 'player', 'team', 'club', 'squad',
      'coach', 'trainer', 'captain', 'referee', 'spectator', 'fan', 'supporter', 'match', 'game',
      'competition', 'compete', 'competitor', 'competitive', 'contest', 'contestant', 'tournament',
      'championship', 'champion', 'league', 'final', 'race', 'racing', 'marathon', 'run', 'runner',
      'running', 'jog', 'sprint', 'swim', 'swimmer', 'swimming', 'pool', 'dive', 'diving',
      'football', 'soccer', 'basketball', 'baseball', 'tennis', 'golf', 'volleyball', 'hockey',
      'rugby', 'cricket', 'boxing', 'wrestling', 'martial arts', 'ski', 'skiing', 'skate',
      'skating', 'surf', 'surfing', 'sail', 'sailing', 'climb', 'climbing', 'hike', 'hiking',
      'exercise', 'workout', 'fitness', 'ball', 'bat', 'racket', 'club', 'net', 'goal', 'court',
      'pitch', 'field', 'track', 'score', 'point', 'win', 'winner', 'victory', 'lose', 'loser',
      'loss', 'beat', 'defeat', 'draw', 'tie', 'medal', 'trophy', 'cup', 'prize', 'award',
      'reward', 'record', 'olympic', 'kick', 'throw', 'catch', 'bounce', 'shoot', 'shot', 'jump',
      'leap', 'gamble', 'bet', 'card', 'chess', 'puzzle', 'quiz'
    ]),
    viPhrases: [
      'thể thao', 'vận động viên', 'cầu thủ', 'đội tuyển', 'câu lạc bộ', 'huấn luyện viên',
      'đội trưởng', 'trọng tài', 'cổ động viên', 'người hâm mộ', 'trận đấu', 'trò chơi', 'cuộc thi',
      'đối thủ', 'giải đấu', 'nhà vô địch', 'cuộc đua', 'bơi lội', 'bóng đá', 'bóng rổ', 'bóng chày',
      'quần vợt', 'bóng chuyền', 'trượt tuyết', 'lướt sóng', 'leo núi', 'thể dục', 'quả bóng',
      'bàn thắng', 'ghi bàn', 'chiến thắng', 'đánh bại', 'huy chương', 'giải thưởng', 'kỷ lục', 'cờ vua'
    ]
  },

  // ================= NHÓM 3: CÔNG VIỆC, KINH TẾ & GIÁO DỤC =================
  {
    id: 'work_career',
    category: MACRO_CATEGORIES.WORK_EDUCATION,
    title: 'Công việc & Nghề nghiệp',
    unitTitles: ['Nghề nghiệp & Việc làm', 'Công sở & Quản lý', 'Sự nghiệp & Tuyển dụng'],
    enWords: new Set([
      'work', 'working', 'worker', 'workplace', 'workforce', 'job', 'career', 'profession',
      'professional', 'occupation', 'post', 'position', 'role', 'employment', 'employ',
      'employee', 'employer', 'unemployed', 'unemployment', 'staff', 'personnel', 'colleague',
      'coworker', 'boss', 'manager', 'management', 'director', 'executive', 'administrator',
      'administration', 'president', 'chairman', 'chief', 'leader', 'leadership', 'supervisor',
      'assistant', 'secretary', 'clerk', 'receptionist', 'agent', 'representative', 'consultant',
      'expert', 'specialist', 'advisor', 'engineer', 'architect', 'mechanic', 'technician',
      'electrician', 'plumber', 'builder', 'farmer', 'fisherman', 'cleaner', 'guard', 'servant',
      'office', 'desk', 'meeting', 'appointment', 'conference', 'seminar', 'presentation',
      'agenda', 'schedule', 'deadline', 'shift', 'overtime', 'leave', 'holiday', 'project',
      'task', 'duty', 'responsibility', 'responsible', 'workload', 'effort', 'experience',
      'experienced', 'skill', 'skilled', 'qualification', 'qualified', 'cv', 'resume',
      'application', 'applicant', 'candidate', 'interview', 'hire', 'recruit', 'recruitment',
      'train', 'training', 'promote', 'promotion', 'retire', 'retirement', 'retired', 'resign',
      'resignation', 'quit', 'dismiss', 'sack', 'strike', 'union', 'contract'
    ]),
    viPhrases: [
      'công việc', 'việc làm', 'nơi làm việc', 'lực lượng lao động', 'sự nghiệp', 'nghề nghiệp',
      'chuyên nghiệp', 'nhân viên', 'người sử dụng lao động', 'thất nghiệp', 'đồng nghiệp',
      'ông chủ', 'người quản lý', 'ban giám đốc', 'giám đốc', 'điều hành', 'chủ tịch', 'lãnh đạo',
      'trợ lý', 'thư ký', 'chuyên gia', 'cố vấn', 'kiến trúc sư', 'thợ máy', 'nông dân', 'văn phòng',
      'cuộc họp', 'cuộc hẹn', 'hội nghị', 'thuyết trình', 'chương trình nghị sự', 'thời hạn',
      'ca làm việc', 'dự án', 'nhiệm vụ', 'trách nhiệm', 'kinh nghiệm', 'kỹ năng', 'trình độ',
      'ứng viên', 'phỏng vấn', 'tuyển dụng', 'đào tạo', 'thăng chức', 'nghỉ hưu', 'từ chức',
      'sa thải', 'đình công', 'công đoàn', 'hợp đồng'
    ]
  },
  {
    id: 'business_finance',
    category: MACRO_CATEGORIES.WORK_EDUCATION,
    title: 'Kinh doanh & Tài chính',
    unitTitles: ['Mua sắm & Giá cả', 'Kinh doanh & Thương mại', 'Tài chính & Ngân hàng', 'Kinh tế & Đầu tư'],
    enWords: new Set([
      'business', 'Businessman', 'businesswoman', 'company', 'firm', 'corporation', 'corporate',
      'enterprise', 'organization', 'organisation', 'agency', 'institution', 'branch',
      'department', 'division', 'sector', 'industry', 'industrial', 'manufacture', 'manufacturer',
      'manufacturing', 'produce', 'producer', 'product', 'production', 'output', 'goods',
      'commodity', 'brand', 'service', 'client', 'customer', 'consumer', 'consumption', 'buyer',
      'seller', 'vendor', 'merchant', 'dealer', 'supplier', 'supply', 'demand', 'market',
      'marketing', 'trade', 'trading', 'commerce', 'commercial', 'retail', 'wholesale', 'export',
      'import', 'deal', 'agreement', 'negotiate', 'negotiation', 'partner', 'partnership',
      'merge', 'monopoly', 'compete', 'competition', 'strategy', 'target', 'goal', 'objective',
      'money', 'cash', 'coin', 'note', 'banknote', 'currency', 'dollar', 'euro', 'pound', 'cent',
      'penny', 'price', 'priceless', 'cost', 'costly', 'value', 'valuable', 'worth', 'cheap',
      'inexpensive', 'expensive', 'free', 'discount', 'bargain', 'sale', 'offer', 'purchase',
      'buy', 'sell', 'order', 'deliver', 'delivery', 'pay', 'payment', 'repay', 'salary', 'wage',
      'income', 'revenue', 'earning', 'profit', 'profitable', 'loss', 'benefit', 'bonus',
      'commission', 'pension', 'welfare', 'grant', 'subsidy', 'tax', 'taxation', 'fee', 'charge',
      'fine', 'fare', 'toll', 'rent', 'rental', 'bill', 'invoice', 'receipt', 'cheque', 'check',
      'credit', 'debit', 'debt', 'loan', 'mortgage', 'interest', 'borrow', 'lend', 'owe',
      'afford', 'affordable', 'spend', 'spending', 'expenditure', 'expense', 'save', 'saving',
      'invest', 'investment', 'investor', 'share', 'shareholder', 'stock', 'bond', 'fund',
      'funding', 'capital', 'capitalism', 'capitalist', 'budget', 'finance', 'financial',
      'economy', 'economic', 'economics', 'economist', 'inflation', 'recession', 'crisis',
      'bank', 'banker', 'banking', 'account', 'accountant', 'accounting', 'audit', 'insurance',
      'insure', 'policy', 'property', 'estate', 'asset', 'wealth', 'wealthy', 'rich', 'poor',
      'poverty', 'millionaire', 'fortune', 'treasure', 'donate', 'donation', 'sponsor'
    ]),
    viPhrases: [
      'kinh doanh', 'doanh nhân', 'công ty', 'doanh nghiệp', 'tập đoàn', 'chi nhánh', 'phòng ban',
      'công nghiệp', 'sản xuất', 'nhà sản xuất', 'sản phẩm', 'hàng hóa', 'thương hiệu', 'dịch vụ',
      'khách hàng', 'người tiêu dùng', 'tiêu thụ', 'người mua', 'người bán', 'nhà cung cấp',
      'cung cầu', 'thị trường', 'tiếp thị', 'thương mại', 'bán lẻ', 'bán buôn', 'xuất khẩu',
      'nhập khẩu', 'đàm phán', 'đối tác', 'chiến lược', 'tiền mặt', 'tiền tệ', 'giá cả', 'chi phí',
      'giá trị', 'đắt tiền', 'giảm giá', 'mua sắm', 'giao hàng', 'thanh toán', 'tiền lương',
      'thu nhập', 'doanh thu', 'lợi nhuận', 'thua lỗ', 'tiền thưởng', 'lương hưu', 'trợ cấp',
      'tiền thuế', 'học phí', 'lệ phí', 'tiền phạt', 'tiền thuê', 'hóa đơn', 'biên lai',
      'thẻ tín dụng', 'khoản nợ', 'khoản vay', 'lãi suất', 'chi tiêu', 'tiết kiệm', 'đầu tư',
      'nhà đầu tư', 'cổ phiếu', 'cổ đông', 'ngân sách', 'tài chính', 'nền kinh tế', 'lạm phát',
      'suy thoái', 'khủng hoảng', 'ngân hàng', 'tài khoản', 'kế toán', 'bảo hiểm', 'bất động sản',
      'tài sản', 'giàu có', 'nghèo đói', 'quyên góp', 'tài trợ'
    ]
  },
  {
    id: 'education_language_study',
    category: MACRO_CATEGORIES.WORK_EDUCATION,
    title: 'Trường học & Giáo dục',
    unitTitles: ['Trường học & Lớp học', 'Học tập & Thi cử', 'Ngôn ngữ & Đọc viết', 'Nghiên cứu & Học thuật'],
    enWords: new Set([
      'school', 'preschool', 'primary', 'elementary', 'secondary', 'college', 'university',
      'academy', 'academic', 'institute', 'campus', 'education', 'educational', 'educate',
      'educated', 'study', 'student', 'pupil', 'scholar', 'scholarship', 'undergraduate',
      'graduate', 'graduation', 'alumni', 'class', 'classroom', 'lesson', 'course', 'curriculum',
      'syllabus', 'subject', 'discipline', 'lecture', 'lecturer', 'tutorial', 'tutor', 'teacher',
      'teach', 'teaching', 'professor', 'instructor', 'headteacher', 'principal', 'dean', 'learn',
      'learner', 'learning', 'knowledge', 'ignorance', 'revise', 'revision', 'memorize', 'exam',
      'examination', 'examine', 'examiner', 'test', 'quiz', 'assess', 'assessment', 'evaluate',
      'evaluation', 'grade', 'mark', 'score', 'result', 'pass', 'fail', 'failure', 'certificate',
      'degree', 'diploma', 'homework', 'assignment', 'essay', 'thesis', 'dissertation', 'paper',
      'report', 'survey', 'research', 'researcher', 'book', 'textbook', 'handbook', 'encyclopedia',
      'dictionary', 'vocabulary', 'glossary', 'notebook', 'diary', 'page', 'margin', 'paragraph',
      'passage', 'text', 'context', 'quote', 'quotation', 'reference', 'summary', 'summarize',
      'outline', 'draft', 'title', 'heading', 'topic', 'theme', 'issue', 'subject', 'theory',
      'theoretical', 'hypothesis', 'concept', 'principle', 'method', 'methodology', 'approach',
      'analysis', 'analyse', 'analyze', 'conclusion', 'conclude', 'evidence', 'finding', 'data',
      'statistics', 'statistical', 'formula', 'equation', 'diagram', 'chart', 'graph', 'table',
      'pen', 'pencil', 'ink', 'ruler', 'eraser', 'board', 'blackboard', 'chalk', 'folder',
      'language', 'linguistic', 'word', 'term', 'phrase', 'idiom', 'proverb', 'clause', 'sentence',
      'grammar', 'grammatical', 'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition',
      'conjunction', 'tense', 'plural', 'singular', 'prefix', 'suffix', 'letter', 'alphabet',
      'vowel', 'consonant', 'syllable', 'spell', 'spelling', 'pronounce', 'pronunciation',
      'accent', 'dialect', 'tone', 'voice', 'fluent', 'fluency', 'native', 'bilingual',
      'translate', 'translation', 'translator', 'interpret', 'interpretation', 'interpreter',
      'meaning', 'mean', 'define', 'definition', 'synonym', 'opposite', 'read', 'reader',
      'reading', 'literacy', 'write', 'writing', 'handwriting', 'listen', 'listener', 'speak',
      'speaker', 'speech', 'talk', 'conversation', 'dialogue', 'chat', 'discuss', 'discussion',
      'debate', 'question', 'questionnaire', 'answer', 'reply', 'respond', 'response', 'explain',
      'explanation', 'describe', 'description', 'illustrate', 'illustration', 'example', 'instance',
      'mathematics', 'maths', 'math', 'algebra', 'geometry', 'history', 'historical', 'historian',
      'geography', 'geographical', 'philosophy', 'philosopher', 'philosophical', 'psychology',
      'psychological', 'psychologist', 'sociology', 'economics', 'biology', 'chemistry', 'physics'
    ]),
    viPhrases: [
      'trường học', 'tiểu học', 'trung học', 'đại học', 'cao đẳng', 'học viện', 'giáo dục',
      'học tập', 'học sinh', 'sinh viên', 'học giả', 'học bổng', 'tốt nghiệp', 'lớp học',
      'bài học', 'khóa học', 'chương trình học', 'môn học', 'bài giảng', 'giảng viên', 'gia sư',
      'giáo viên', 'giáo sư', 'hiệu trưởng', 'kiến thức', 'ôn tập', 'kỳ thi', 'bài kiểm tra',
      'đánh giá', 'điểm số', 'chứng chỉ', 'bằng cấp', 'bài tập về nhà', 'tiểu luận', 'luận văn',
      'khảo sát', 'nghiên cứu', 'sách giáo khoa', 'từ điển', 'từ vựng', 'sổ tay', 'đoạn văn',
      'ngữ cảnh', 'trích dẫn', 'tham khảo', 'tóm tắt', 'bản nháp', 'tiêu đề', 'chủ đề',
      'lý thuyết', 'giả thuyết', 'khái niệm', 'nguyên tắc', 'phương pháp', 'phân tích',
      'kết luận', 'thống kê', 'công thức', 'biểu đồ', 'sơ đồ', 'bút chì', 'thước kẻ', 'ngôn ngữ',
      'thuật ngữ', 'cụm từ', 'thành ngữ', 'ngữ pháp', 'danh từ', 'động từ', 'tính từ', 'trạng từ',
      'đại từ', 'giới từ', 'liên từ', 'bảng chữ cái', 'đánh vần', 'phát âm', 'giọng điệu',
      'trôi chảy', 'bản ngữ', 'dịch thuật', 'bản dịch', 'phiên dịch', 'định nghĩa', 'đồng nghĩa',
      'trái nghĩa', 'hội thoại', 'đối thoại', 'thảo luận', 'tranh luận', 'câu hỏi', 'câu trả lời',
      'giải thích', 'minh họa', 'toán học', 'hình học', 'lịch sử', 'địa lý', 'triết học',
      'tâm lý học', 'xã hội học', 'sinh học', 'hóa học', 'vật lý'
    ]
  },

  // ================= NHÓM 4: TỰ NHIÊN, KHOA HỌC, Y TẾ & XÃ HỘI =================
  {
    id: 'body_health_medicine',
    category: MACRO_CATEGORIES.NATURE_SCIENCE_SOCIETY,
    title: 'Cơ thể & Sức khỏe',
    unitTitles: ['Cơ thể & Giác quan', 'Sức khỏe & Bệnh tật', 'Y tế & Điều trị'],
    enWords: new Set([
      'body', 'bodily', 'physical', 'head', 'skull', 'face', 'Facial', 'forehead', 'cheek',
      'chin', 'jaw', 'hair', 'beard', 'moustache', 'eye', 'eyebrow', 'eyelash', 'eyelid', 'sight',
      'vision', 'visual', 'blind', 'ear', 'hearing', 'deaf', 'nose', 'smell', 'scent', 'mouth',
      'lip', 'tooth', 'teeth', 'tongue', 'throat', 'neck', 'shoulder', 'arm', 'elbow', 'wrist',
      'hand', 'palm', 'finger', 'thumb', 'fist', 'nail', 'chest', 'breast', 'rib', 'waist',
      'stomach', 'belly', 'abdomen', 'hip', 'bottom', 'leg', 'thigh', 'knee', 'ankle', 'foot',
      'feet', 'heel', 'toe', 'skin', 'bone', 'skeleton', 'muscle', 'muscular', 'flesh', 'fat',
      'blood', 'bleed', 'vein', 'artery', 'heart', 'heartbeat', 'pulse', 'brain', 'mind', 'lung',
      'breathe', 'breath', 'breathing', 'liver', 'kidney', 'organ', 'nerve', 'nervous', 'spine',
      'cell', 'gene', 'genetic', 'dna', 'hormone', 'immune', 'sweat', 'tear', 'saliva', 'voice',
      'cough', 'sneeze', 'yawn', 'blink', 'swallow', 'digest', 'sleep', 'asleep', 'awake', 'wake',
      'dream', 'nightmare', 'nap', 'rest', 'relax', 'relaxation', 'tired', 'weary', 'exhausted',
      'exhaustion', 'fatigue', 'energetic', 'health', 'healthy', 'unhealthy', 'hygiene', 'fit',
      'ill', 'illness', 'sick', 'sickness', 'disease', 'disorder', 'syndrome', 'condition',
      'infection', 'infectious', 'infected', 'virus', 'bacteria', 'germ', 'parasite', 'epidemic',
      'pandemic', 'flu', 'cold', 'fever', 'temperature', 'allergy', 'allergic', 'asthma',
      'diabetes', 'cancer', 'tumor', 'stroke', 'attack', 'disability', 'disabled', 'handicap',
      'pain', 'painful', 'painless', 'ache', 'headache', 'toothache', 'stomachache', 'sore',
      'hurt', 'injure', 'injured', 'injury', 'wound', 'wounded', 'bruise', 'scratch', 'cut',
      'burn', 'swollen', 'swell', 'broken', 'fracture', 'poison', 'poisonous', 'toxic', 'stress',
      'hospital', 'clinic', 'ward', 'pharmacy', 'ambulance', 'emergency', 'doctor', 'physician',
      'surgeon', 'dentist', 'nurse', 'paramedic', 'vet', 'patient', 'medical', 'medication',
      'medicine', 'drug', 'pill', 'tablet', 'capsule', 'dose', 'antibiotic', 'painkiller',
      'vaccine', 'vaccination', 'injection', 'needle', 'bandage', 'plaster', 'wheelchair',
      'treatment', 'treat', 'cure', 'heal', 'healing', 'recover', 'recovery', 'survive',
      'survival', 'survivor', 'operation', 'operate', 'surgery', 'surgical', 'transplant',
      'therapy', 'therapist', 'counseling', 'symptom', 'diagnose', 'diagnosis', 'check-up',
      'prescription', 'alive', 'live', 'living', 'life', 'lifetime', 'die', 'dead', 'death',
      'deadly', 'fatal', 'mortal', 'suicide', 'bury', 'burial', 'funeral', 'grave'
    ]),
    viPhrases: [
      'cơ thể', 'khuôn mặt', 'mái tóc', 'đôi mắt', 'thị lực', 'đôi tai', 'thính giác', 'cái mũi',
      'khứu giác', 'cái miệng', 'đôi môi', 'cái răng', 'cái lưỡi', 'cổ họng', 'đôi vai',
      'cánh tay', 'khuỷu tay', 'cổ tay', 'bàn tay', 'ngón tay', 'lồng ngực', 'dạ dày', 'đầu gối',
      'mắt cá chân', 'bàn chân', 'ngón chân', 'làn da', 'bộ xương', 'cơ bắp', 'mạch máu',
      'trái tim', 'nhịp tim', 'bộ não', 'lá phổi', 'hơi thở', 'hô hấp', 'dây thần kinh',
      'tế bào', 'di truyền', 'miễn dịch', 'mồ hôi', 'nước mắt', 'giấc ngủ', 'ác mộng', 'nghỉ ngơi',
      'thư giãn', 'mệt mỏi', 'kiệt sức', 'sức khỏe', 'khỏe mạnh', 'vệ sinh', 'bệnh tật',
      'căn bệnh', 'nhiễm trùng', 'vi-rút', 'vi khuẩn', 'dịch bệnh', 'cảm cúm', 'cảm lạnh',
      'dị ứng', 'ung thư', 'đột quỵ', 'khuyết tật', 'đau đớn', 'đau đầu', 'đau răng', 'chấn thương',
      'vết thương', 'vết bỏng', 'chất độc', 'độc hại', 'bệnh viện', 'phòng khám', 'xe cứu thương',
      'cấp cứu', 'bác sĩ', 'bác sĩ phẫu thuật', 'nha sĩ', 'y tá', 'bệnh nhân', 'thuốc men',
      'viên thuốc', 'kháng sinh', 'vắc-xin', 'tiêm chủng', 'băng gạc', 'xe lăn', 'điều trị',
      'chữa lành', 'hồi phục', 'sống sót', 'phẫu thuật', 'trị liệu', 'triệu chứng', 'chẩn đoán',
      'tử vong', 'cái chết', 'đám tang'
    ]
  },
  {
    id: 'nature_environment_animals',
    category: MACRO_CATEGORIES.NATURE_SCIENCE_SOCIETY,
    title: 'Thiên nhiên & Động vật',
    unitTitles: ['Động vật & Cây cối', 'Thời tiết & Khí hậu', 'Địa hình & Thiên nhiên', 'Môi trường & Sinh thái'],
    enWords: new Set([
      'nature', 'natural', 'environment', 'environmental', 'ecology', 'ecological', 'ecosystem',
      'habitat', 'conservation', 'preserve', 'wildlife', 'wild', 'climate', 'weather', 'forecast',
      'air', 'atmosphere', 'ozone', 'oxygen', 'carbon', 'sky', 'horizon', 'sun', 'sunny',
      'sunshine', 'sunlight', 'sunrise', 'sunset', 'shade', 'shadow', 'moon', 'lunar', 'star',
      'solar', 'planet', 'earth', 'globe', 'world', 'space', 'outer space', 'universe', 'galaxy',
      'cloud', 'cloudy', 'rain', 'rainy', 'rainfall', 'shower', 'pour', 'rainbow', 'snow',
      'snowy', 'ice', 'icy', 'freeze', 'freezing', 'frost', 'melt', 'wind', 'windy', 'breeze',
      'blow', 'storm', 'stormy', 'hurricane', 'typhoon', 'tornado', 'thunder', 'lightning', 'fog',
      'foggy', 'mist', 'humid', 'wet', 'damp', 'dry', 'drought', 'warm', 'warmth', 'hot', 'heat',
      'boil', 'cool', 'cold', 'chilly', 'season', 'seasonal', 'spring', 'summer', 'autumn',
      'winter', 'land', 'landscape', 'scenery', 'ground', 'underground', 'soil', 'dirt', 'mud',
      'dust', 'sand', 'sandy', 'rock', 'rocky', 'stone', 'pebble', 'mineral', 'cave', 'cavern',
      'mountain', 'mount', 'peak', 'summit', 'hill', 'steep', 'slope', 'valley', 'cliff',
      'desert', 'forest', 'wood', 'woodland', 'jungle', 'rainforest', 'field', 'meadow', 'plain',
      'island', 'peninsula', 'continent', 'coast', 'coastal', 'shore', 'beach', 'bay', 'harbor',
      'sea', 'ocean', 'marine', 'wave', 'tide', 'current', 'underwater', 'shallow', 'deep',
      'river', 'Riverbank', 'stream', 'canal', 'lake', 'pond', 'waterfall', 'dam', 'flood',
      'earthquake', 'volcano', 'eruption', 'tsunami', 'disaster', 'catastrophe', 'pollution',
      'pollute', 'pollutant', 'emission', 'fume', 'smoke', 'smog', 'toxic', 'waste', 'litter',
      'recycle', 'recycling', 'renewable', 'sustainable', 'energy', 'power', 'coal', 'oil',
      'gas', 'nuclear', 'plant', 'vegetation', 'tree', 'trunk', 'bark', 'branch', 'twig', 'leaf',
      'leaves', 'root', 'stem', 'seed', 'sow', 'flower', 'blossom', 'bloom', 'petal', 'rose',
      'grass', 'lawn', 'weed', 'bush', 'hedge', 'crop', 'harvest', 'agriculture', 'agricultural',
      'ripe', 'rot', 'rotten', 'animal', 'creature', 'species', 'mammal', 'reptile', 'predator',
      'prey', 'pet', 'dog', 'puppy', 'cat', 'kitten', 'horse', 'pony', 'cow', 'cattle', 'bull',
      'calf', 'sheep', 'lamb', 'pig', 'goat', 'donkey', 'chicken', 'hen', 'rooster', 'duck',
      'goose', 'turkey', 'bird', 'owl', 'eagle', 'crow', 'pigeon', 'parrot', 'penguin', 'wing',
      'feather', 'beak', 'nest', 'cage', 'fish', 'salmon', 'shark', 'whale', 'dolphin', 'seal',
      'octopus', 'crab', 'shell', 'lion', 'tiger', 'leopard', 'bear', 'wolf', 'fox', 'deer',
      'camel', 'giraffe', 'zebra', 'elephant', 'monkey', 'ape', 'kangaroo', 'rabbit', 'mouse',
      'mice', 'rat', 'squirrel', 'bat', 'snake', 'lizard', 'turtle', 'crocodile', 'frog',
      'insect', 'bug', 'bee', 'wasp', 'ant', 'butterfly', 'mosquito', 'fly', 'spider', 'web',
      'worm', 'tail', 'paw', 'claw', 'horn', 'hunt', 'hunter', 'hunting', 'trap', 'breed', 'tame', 'bark'
    ]),
    viPhrases: [
      'thiên nhiên', 'tự nhiên', 'môi trường', 'sinh thái', 'hệ sinh thái', 'môi trường sống',
      'bảo tồn', 'động vật hoang dã', 'khí hậu', 'thời tiết', 'dự báo', 'không khí', 'bầu khí quyển',
      'bầu trời', 'đường chân trời', 'mặt trời', 'ánh nắng', 'bình minh', 'hoàng hôn', 'bóng râm',
      'mặt trăng', 'ngôi sao', 'hành tinh', 'trái đất', 'vũ trụ', 'đám mây', 'cơn mưa', 'cầu vồng',
      'tuyết rơi', 'đóng băng', 'sương giá', 'tan chảy', 'cơn bão', 'sấm sét', 'sương mù', 'ẩm ướt',
      'hạn hán', 'ấm áp', 'nóng bức', 'mát mẻ', 'lạnh giá', 'mùa xuân', 'mùa hè', 'mùa thu',
      'mùa đông', 'phong cảnh', 'mặt đất', 'đất đai', 'bụi bẩn', 'bãi cát', 'tảng đá', 'hang động',
      'ngọn núi', 'đỉnh núi', 'ngọn đồi', 'thung lũng', 'vách đá', 'sa mạc', 'khu rừng', 'rừng nhiệt đới',
      'cánh đồng', 'hòn đảo', 'lục địa', 'bờ biển', 'bãi biển', 'đại dương', 'thủy triều',
      'dòng sông', 'con suối', 'thác nước', 'lũ lụt', 'động đất', 'núi lửa', 'thảm họa', 'ô nhiễm',
      'khí thải', 'tái chế', 'năng lượng', 'than đá', 'thực vật', 'cái cây', 'cành cây', 'chiếc lá',
      'rễ cây', 'hạt giống', 'bông hoa', 'bãi cỏ', 'bụi cây', 'mùa màng', 'thu hoạch', 'nông nghiệp',
      'động vật', 'sinh vật', 'thú cưng', 'con chó', 'con mèo', 'con ngựa', 'con bò', 'con cừu',
      'con lợn', 'con dê', 'con gà', 'con vịt', 'con chim', 'đại bàng', 'chim cánh cụt', 'đôi cánh',
      'lông vũ', 'tổ chim', 'cá mập', 'cá voi', 'cá heo', 'sư tử', 'con hổ', 'con gấu', 'con sói',
      'con cáo', 'con hươu', 'lạc đà', 'con voi', 'con khỉ', 'con thỏ', 'con chuột', 'con rắn',
      'con ếch', 'côn trùng', 'con ong', 'con kiến', 'bươm bướm', 'con muỗi', 'con nhện', 'cái đuôi'
    ]
  },
  {
    id: 'science_tech_engineering',
    category: MACRO_CATEGORIES.NATURE_SCIENCE_SOCIETY,
    title: 'Công nghệ & Khoa học',
    unitTitles: ['Máy tính & Internet', 'Thiết bị & Điện tử', 'Khoa học & Phát minh'],
    enWords: new Set([
      'science', 'scientific', 'scientist', 'technology', 'technological', 'technical', 'technique',
      'high-tech', 'engineering', 'machine', 'machinery', 'mechanism', 'mechanical', 'device',
      'gadget', 'appliance', 'equipment', 'instrument', 'apparatus', 'system', 'network',
      'computer', 'pc', 'laptop', 'tablet', 'screen', 'monitor', 'display', 'keyboard', 'mouse',
      'printer', 'scanner', 'speaker', 'microphone', 'camera', 'hardware', 'software', 'program',
      'programming', 'programmer', 'code', 'coding', 'algorithm', 'ai', 'artificial', 'robot',
      'robotics', 'automated', 'automatic', 'automatically', 'automation', 'data', 'database',
      'digital', 'virtual', 'cyber', 'electronic', 'electronics', 'electric', 'electrical',
      'electricity', 'power', 'generator', 'battery', 'charge', 'charger', 'cable', 'wire',
      'plug', 'socket', 'switch', 'button', 'lever', 'dial', 'sensor', 'signal', 'transmission',
      'transmit', 'frequency', 'wave', 'radio', 'radar', 'satellite', 'antenna', 'laser', 'fiber',
      'internet', 'net', 'web', 'website', 'webpage', 'site', 'browser', 'engine', 'online',
      'offline', 'wi-fi', 'wifi', 'wireless', 'broadband', 'email', 'message', 'messaging',
      'text', 'forum', 'blog', 'app', 'application', 'platform', 'file', 'folder', 'document',
      'directory', 'disk', 'drive', 'memory', 'storage', 'backup', 'download', 'upload', 'stream',
      'install', 'update', 'upgrade', 'delete', 'click', 'scroll', 'type', 'input', 'output',
      'search', 'link', 'access', 'login', 'password', 'username', 'account', 'user', 'profile',
      'privacy', 'hack', 'hacker', 'security', 'phone', 'telephone', 'mobile', 'cellphone',
      'smartphone', 'call', 'dial', 'ring', 'text', 'audio', 'video', 'record', 'recording',
      'invent', 'invention', 'inventor', 'innovate', 'innovation', 'innovative', 'discover',
      'discovery', 'explore', 'exploration', 'explorer', 'experiment', 'experimental',
      'laboratory', 'lab', 'test', 'sample', 'specimen', 'microscope', 'telescope', 'observe',
      'observation', 'phenomenon', 'element', 'compound', 'chemical', 'chemistry', 'chemist',
      'acid', 'gas', 'liquid', 'solid', 'fluid', 'vapor', 'steam', 'atom', 'atomic', 'molecule',
      'nuclear', 'radiation', 'radioactive', 'physics', 'physicist', 'gravity', 'force',
      'pressure', 'friction', 'motion', 'velocity', 'acceleration', 'magnet', 'magnetic', 'ray',
      'beam', 'astronomy', 'astronaut', 'rocket', 'spacecraft', 'orbit', 'launch'
    ]),
    viPhrases: [
      'khoa học', 'nhà khoa học', 'công nghệ', 'kỹ thuật', 'máy móc', 'cơ khí', 'thiết bị',
      'dụng cụ', 'hệ thống', 'mạng lưới', 'máy tính', 'màn hình', 'bàn phím', 'máy in',
      'phần cứng', 'phần mềm', 'lập trình', 'thuật toán', 'trí tuệ nhân tạo', 'tự động hóa',
      'dữ liệu', 'cơ sở dữ liệu', 'kỹ thuật số', 'điện tử', 'dòng điện', 'điện năng', 'cục pin',
      'dây cáp', 'ổ cắm', 'công tắc', 'cảm biến', 'tín hiệu', 'tần số', 'vệ tinh', 'tia la-de',
      'mạng internet', 'trang web', 'trình duyệt', 'trực tuyến', 'không dây', 'thư điện tử',
      'tin nhắn', 'ứng dụng', 'tập tin', 'thư mục', 'tài liệu', 'bộ nhớ', 'lưu trữ', 'tải xuống',
      'tải lên', 'cài đặt', 'cập nhật', 'mật khẩu', 'người dùng', 'điện thoại', 'di động',
      'phát minh', 'nhà phát minh', 'đổi mới', 'khám phá', 'thám hiểm', 'thí nghiệm',
      'phòng thí nghiệm', 'kính hiển vi', 'kính thiên văn', 'quan sát', 'hiện tượng', 'hóa chất',
      'chất lỏng', 'chất rắn', 'hơi nước', 'nguyên tử', 'phân tử', 'hạt nhân', 'phóng xạ',
      'bức xạ', 'trọng lực', 'áp suất', 'nam châm', 'từ trường', 'phi hành gia', 'tên lửa', 'tàu vũ trụ'
    ]
  },
  {
    id: 'society_law_politics',
    category: MACRO_CATEGORIES.NATURE_SCIENCE_SOCIETY,
    title: 'Xã hội & Pháp luật',
    unitTitles: ['Xã hội & Văn hóa', 'Pháp luật & Tòa án', 'Chính trị & Nhà nước', 'An ninh & Quân sự'],
    enWords: new Set([
      'society', 'social', 'community', 'public', 'citizen', 'citizenship', 'civil', 'civilian',
      'population', 'demographic', 'minority', 'majority', 'ethnic', 'race', 'racial', 'racism',
      'culture', 'cultural', 'multicultural', 'tradition', 'traditional', 'custom', 'heritage',
      'civilization', 'religion', 'religious', 'faith', 'belief', 'god', 'goddess', 'holy',
      'sacred', 'spiritual', 'soul', 'spirit', 'heaven', 'hell', 'pray', 'prayer', 'priest',
      'moral', 'morality', 'ethics', 'ethical', 'value', 'norm', 'charity', 'charitable',
      'volunteer', 'voluntary', 'aid', 'relief', 'humanitarian', 'welfare', 'equality', 'equal',
      'inequality', 'unequal', 'discrimination', 'prejudice', 'gender', 'feminist', 'freedom',
      'liberty', 'independence', 'independent', 'dependent', 'slavery', 'slave', 'politics',
      'political', 'politician', 'government', 'govern', 'governance', 'governor', 'regime',
      'authority', 'official', 'bureaucracy', 'state', 'national', 'international', 'global',
      'globalization', 'federal', 'parliament', 'congress', 'senate', 'senator', 'council',
      'committee', 'commission', 'ministry', 'minister', 'cabinet', 'president', 'presidential',
      'prime minister', 'mayor', 'ambassador', 'diplomat', 'diplomatic', 'embassy', 'king',
      'queen', 'prince', 'princess', 'royal', 'monarch', 'monarchy', 'crown', 'throne', 'lord',
      'noble', 'empire', 'emperor', 'colony', 'colonial', 'democracy', 'democratic', 'republic',
      'dictator', 'socialist', 'communist', 'conservative', 'liberal', 'radical', 'election',
      'elect', 'vote', 'voter', 'voting', 'ballot', 'poll', 'campaign', 'candidate', 'party',
      'opposition', 'policy', 'reform', 'revolution', 'protest', 'demonstration', 'march',
      'riot', 'treaty', 'alliance', 'ally', 'law', 'lawful', 'legal', 'illegal', 'legislation',
      'constitution', 'constitutional', 'rule', 'regulation', 'ban', 'prohibit', 'forbid',
      'permit', 'permission', 'licence', 'license', 'right', 'privilege', 'justice', 'injustice',
      'fair', 'unfair', 'court', 'courtroom', 'judge', 'jury', 'lawyer', 'attorney', 'solicitor',
      'trial', 'hearing', 'case', 'lawsuit', 'sue', 'accuse', 'accusation', 'charge', 'prosecute',
      'prosecution', 'defend', 'defendant', 'defense', 'defence', 'verdict', 'guilty', 'innocent',
      'convict', 'conviction', 'sentence', 'punish', 'punishment', 'penalty', 'fine', 'execution',
      'crime', 'criminal', 'offence', 'offense', 'offender', 'commit', 'illegal', 'gang',
      'victim', 'witness', 'suspect', 'clue', 'evidence', 'proof', 'prove', 'investigate',
      'investigation', 'investigator', 'detective', 'police', 'policeman', 'policewoman', 'cop',
      'officer', 'arrest', 'capture', 'catch', 'custody', 'prison', 'prisoner', 'jail', 'cell',
      'escape', 'steal', 'theft', 'thief', 'rob', 'robber', 'robbery', 'burglar', 'burglary',
      'smuggle', 'fraud', 'corruption', 'corrupt', 'bribe', 'kidnap', 'hijack', 'terror',
      'terrorism', 'terrorist', 'hostage', 'murder', 'murderer', 'kill', 'killer', 'killing',
      'assassinate', 'rape', 'abuse', 'assault', 'attack', 'attacker', 'violence', 'violent',
      'force', 'weapon', 'arm', 'armed', 'arms', 'gun', 'rifle', 'bullet', 'fire', 'shoot',
      'shooting', 'knife', 'sword', 'bomb', 'explosive', 'explode', 'explosion', 'blast',
      'nuclear', 'war', 'warfare', 'warrior', 'peace', 'peaceful', 'truce', 'conflict', 'battle',
      'battlefield', 'combat', 'fight', 'fighting', 'fighter', 'struggle', 'invade', 'invasion',
      'occupy', 'occupation', 'conquer', 'defeat', 'surrender', 'retreat', 'victory', 'enemy',
      'foe', 'army', 'military', 'armed forces', 'soldier', 'troop', 'general', 'commander',
      'command', 'officer', 'rank', 'navy', 'naval', 'air force', 'tank', 'missile', 'shield',
      'protect', 'protection', 'protective', 'secure', 'security', 'safe', 'safety', 'safeguard',
      'guard', 'patrol', 'spy', 'danger', 'dangerous', 'hazard', 'threat', 'threaten', 'risk',
      'risky', 'emergency', 'rescue'
    ]),
    viPhrases: [
      'xã hội', 'cộng đồng', 'công chúng', 'công dân', 'dân số', 'đa số', 'thiểu số', 'dân tộc',
      'chủng tộc', 'văn hóa', 'truyền thống', 'phong tục', 'di sản', 'nền văn minh', 'tôn giáo',
      'đức tin', 'tín ngưỡng', 'thần thánh', 'linh thiêng', 'tâm linh', 'linh hồn', 'thiên đường',
      'cầu nguyện', 'linh mục', 'đạo đức', 'từ thiện', 'tình nguyện', 'nhân đạo', 'phúc lợi',
      'bình đẳng', 'bất bình đẳng', 'phân biệt đối xử', 'định kiến', 'giới tính', 'tự do',
      'độc lập', 'nô lệ', 'chính trị', 'chính trị gia', 'chính phủ', 'chính quyền', 'nhà nước',
      'quốc gia', 'quốc tế', 'toàn cầu', 'quốc hội', 'thượng viện', 'ủy ban', 'hội đồng',
      'bộ trưởng', 'nội các', 'tổng thống', 'thủ tướng', 'thị trưởng', 'đại sứ', 'ngoại giao',
      'đại sứ quán', 'nhà vua', 'nữ hoàng', 'hoàng tử', 'công chúa', 'hoàng gia', 'ngai vàng',
      'đế chế', 'hoàng đế', 'thuộc địa', 'dân chủ', 'cộng hòa', 'độc tài', 'bầu cử', 'bỏ phiếu',
      'cử tri', 'lá phiếu', 'chiến dịch', 'chính sách', 'cải cách', 'cách mạng', 'biểu tình',
      'hiệp ước', 'liên minh', 'đồng minh', 'luật pháp', 'pháp luật', 'hợp pháp', 'bất hợp pháp',
      'hiến pháp', 'quy định', 'cấm đoán', 'giấy phép', 'nhân quyền', 'đặc quyền', 'công lý',
      'bất công', 'công bằng', 'tòa án', 'thẩm phán', 'bồi thẩm đoàn', 'luật sư', 'phiên tòa',
      'vụ kiện', 'buộc tội', 'cáo buộc', 'truy tố', 'bào chữa', 'bị cáo', 'phán quyết', 'có tội',
      'vô tội', 'kết án', 'bản án', 'trừng phạt', 'hình phạt', 'tội phạm', 'tội ác', 'phạm tội',
      'nạn nhân', 'nhân chứng', 'nghi phạm', 'manh mối', 'bằng chứng', 'điều tra', 'thám tử',
      'cảnh sát', 'bắt giữ', 'nhà tù', 'tù nhân', 'trốn thoát', 'ăn cắp', 'kẻ trộm', 'vụ cướp',
      'buôn lậu', 'gian lận', 'tham nhũng', 'hối lộ', 'bắt cóc', 'khủng bố', 'con tin',
      'giết người', 'kẻ giết người', 'ám sát', 'tấn công', 'bạo lực', 'vũ khí', 'súng đạn',
      'viên đạn', 'quả bom', 'vụ nổ', 'chiến tranh', 'hòa bình', 'xung đột', 'trận chiến',
      'chiến trường', 'xâm lược', 'đầu hàng', 'kẻ thù', 'quân đội', 'quân sự', 'người lính',
      'chỉ huy', 'hải quân', 'tên lửa', 'bảo vệ', 'an ninh', 'an toàn', 'nguy hiểm', 'đe dọa',
      'rủi ro', 'giải cứu'
    ]
  },
  {
    id: 'time_numbers_measures',
    category: MACRO_CATEGORIES.NATURE_SCIENCE_SOCIETY,
    title: 'Thời gian & Đo lường',
    unitTitles: [
      'Thời gian & Ngày tháng',
      'Số đếm & Tần suất',
      'Kích thước & Độ dài',
      'Trọng lượng & Đo lường',
      'Màu sắc & Ánh sáng',
      'Hình dạng & Không gian',
      'Mức độ & Tỷ lệ'
    ],
    enWords: new Set([
      'time', 'second', 'minute', 'hour', 'o’clock', "o'clock", 'day', 'daily', 'daytime',
      'daylight', 'dawn', 'morning', 'noon', 'midday', 'afternoon', 'dusk', 'evening', 'night',
      'midnight', 'overnight', 'tonight', 'today', 'tomorrow', 'yesterday', 'week', 'weekday',
      'weekend', 'weekly', 'fortnight', 'month', 'monthly', 'year', 'yearly', 'annual',
      'annually', 'decade', 'century', 'millennium', 'era', 'age', 'epoch', 'period', 'phase',
      'stage', 'spell', 'interval', 'term', 'semester', 'moment', 'instant', 'meanwhile',
      'date', 'calendar', 'timetable', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
      'saturday', 'sunday', 'january', 'february', 'march', 'april', 'may', 'june', 'july',
      'august', 'september', 'october', 'november', 'december', 'past', 'present', 'future',
      'ancient', 'medieval', 'modern', 'contemporary', 'current', 'currently', 'recent',
      'recently', 'lately', 'nowadays', 'former', 'formerly', 'previous', 'previously', 'prior',
      'initial', 'initially', 'original', 'originally', 'first', 'firstly', 'last', 'lastly',
      'final', 'finally', 'eventual', 'eventually', 'ultimate', 'ultimately', 'next', 'following',
      'subsequent', 'subsequently', 'early', 'late', 'punctual', 'soon', 'shortly', 'presently',
      'immediately', 'instant', 'instantly', 'direct', 'directly', 'prompt', 'rapid', 'rapidly',
      'quick', 'quickly', 'fast', 'swift', 'sudden', 'suddenly', 'gradual', 'gradually', 'slow',
      'slowly', 'steady', 'steadily', 'constant', 'constantly', 'continuous', 'continually',
      'permanent', 'permanently', 'temporary', 'temporarily', 'brief', 'briefly', 'eternal',
      'always', 'forever', 'usually', 'normally', 'generally', 'regular', 'regularly', 'often',
      'frequent', 'frequently', 'repeatedly', 'sometimes', 'occasionally', 'rare', 'rarely',
      'seldom', 'hardly', 'never', 'ever', 'already', 'yet', 'still', 'just', 'ago', 'number',
      'numeral', 'numeric', 'digit', 'figure', 'zero', 'nil', 'one', 'two', 'three', 'four',
      'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'dozen', 'thirteen',
      'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'thirty',
      'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred', 'thousand', 'million',
      'billion', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth',
      'ninth', 'tenth', 'single', 'double', 'triple', 'multiple', 'once', 'twice', 'half',
      'quarter', 'third', 'fraction', 'decimal', 'percent', 'per cent', 'percentage', 'ratio',
      'proportion', 'rate', 'scale', 'degree', 'extent', 'average', 'mean', 'median', 'total',
      'sum', 'whole', 'overall', 'amount', 'quantity', 'volume', 'capacity', 'mass', 'bulk',
      'plenty', 'excess', 'shortage', 'lack', 'count', 'calculate', 'calculation', 'estimate',
      'measure', 'measurement', 'unit', 'metric', 'size', 'dimension', 'length', 'long', 'short',
      'width', 'wide', 'broad', 'narrow', 'height', 'high', 'tall', 'low', 'depth', 'deep',
      'thick', 'thin', 'slim', 'fat', 'flat', 'steep', 'huge', 'enormous', 'vast', 'giant',
      'massive', 'immense', 'tremendous', 'large', 'big', 'great', 'medium', 'small', 'little',
      'tiny', 'minute', 'microscopic', 'weight', 'weigh', 'heavy', 'light', 'gram', 'kilogram',
      'kilo', 'ton', 'tonne', 'pound', 'ounce', 'metre', 'meter', 'kilometre', 'kilometer',
      'centimetre', 'centimeter', 'millimetre', 'inch', 'foot', 'yard', 'mile', 'acre', 'litre',
      'liter', 'pint', 'gallon', 'drop', 'pair', 'set', 'group', 'batch', 'bunch', 'pack',
      'pile', 'heap', 'load', 'piece', 'bit', 'slice', 'lump', 'fragment', 'portion', 'part',
      'section', 'segment', 'division', 'half', 'shape', 'shaped', 'circle', 'circular', 'round',
      'sphere', 'square', 'rectangle', 'rectangular', 'triangle', 'triangular', 'oval', 'cube',
      'cone', 'cylinder', 'pyramid', 'spiral', 'line', 'linear', 'straight', 'vertical',
      'horizontal', 'parallel', 'diagonal', 'curve', 'curved', 'bend', 'bent', 'twisted',
      'angle', 'corner', 'edge', 'border', 'margin', 'surface', 'layer', 'level', 'top',
      'bottom', 'peak', 'base', 'side', 'front', 'back', 'rear', 'middle', 'center', 'core',
      'hole', 'gap', 'space', 'dot', 'spot', 'point', 'mark', 'cross', 'row', 'column',
      'pattern', 'stripe', 'colour', 'color', 'coloured', 'colorful', 'colorless', 'shade',
      'tone', 'tint', 'dye', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'violet',
      'pink', 'brown', 'black', 'white', 'grey', 'gray', 'silver', 'gold', 'blonde', 'fair',
      'dark', 'light', 'bright', 'brilliant', 'vivid', 'pale', 'faint', 'dull', 'dim', 'shiny', 'glow'
    ]),
    viPhrases: [
      'thời gian', 'buổi sáng', 'buổi trưa', 'buổi chiều', 'buổi tối', 'ban đêm', 'nửa đêm',
      'hôm nay', 'ngày mai', 'hôm qua', 'cuối tuần', 'hàng ngày', 'hàng tuần', 'hàng tháng',
      'hàng năm', 'thập kỷ', 'thế kỷ', 'thiên niên kỷ', 'kỷ nguyên', 'thời đại', 'giai đoạn',
      'khoảnh khắc', 'thời khóa biểu', 'thứ hai', 'thứ ba', 'thứ tư', 'thứ năm', 'thứ sáu',
      'thứ bảy', 'chủ nhật', 'tháng một', 'tháng hai', 'tháng ba', 'tháng tư', 'tháng năm',
      'tháng sáu', 'tháng bảy', 'tháng tám', 'tháng chín', 'tháng mười', 'quá khứ', 'hiện tại',
      'tương lai', 'cổ đại', 'trung cổ', 'hiện đại', 'đương đại', 'gần đây', 'trước đây',
      'ban đầu', 'cuối cùng', 'ngay lập tức', 'nhanh chóng', 'đột ngột', 'dần dần', 'chậm rãi',
      'liên tục', 'vĩnh viễn', 'tạm thời', 'luôn luôn', 'thường xuyên', 'thỉnh thoảng',
      'hiếm khi', 'không bao giờ', 'chữ số', 'con số', 'một trăm', 'một nghìn', 'một triệu',
      'một tỷ', 'gấp đôi', 'gấp ba', 'một nửa', 'một phần tư', 'phần trăm', 'tỷ lệ', 'trung bình',
      'tổng cộng', 'số lượng', 'khối lượng', 'dung tích', 'tính toán', 'ước tính', 'đo lường',
      'đơn vị', 'kích thước', 'chiều dài', 'chiều rộng', 'chiều cao', 'chiều sâu', 'khổng lồ',
      'to lớn', 'nhỏ bé', 'tí hon', 'trọng lượng', 'cân nặng', 'ki-lô-gam', 'ki-lô-mét',
      'hình dạng', 'hình tròn', 'hình vuông', 'hình chữ nhật', 'hình tam giác', 'đường thẳng',
      'thẳng đứng', 'nằm ngang', 'song song', 'đường cong', 'bề mặt', 'màu sắc', 'sặc sỡ',
      'màu đỏ', 'màu xanh', 'màu vàng', 'màu cam', 'màu tím', 'màu hồng', 'màu nâu', 'màu đen',
      'màu trắng', 'màu xám', 'sáng chói', 'nhợt nhạt'
    ]
  },

  // ================= NHÓM 5: TƯ DUY, CẢM XÚC, HÀNH ĐỘNG & NGỮ PHÁP =================
  {
    id: 'feelings_emotions_personality',
    category: MACRO_CATEGORIES.MIND_ACTIONS_GRAMMAR,
    title: 'Cảm xúc & Tính cách',
    unitTitles: ['Cảm xúc & Tâm trạng', 'Tính cách & Thái độ', 'Phẩm chất con người', 'Trạng thái tinh thần'],
    enWords: new Set([
      'feel', 'feeling', 'emotion', 'emotional', 'mood', 'passion', 'passionate', 'temper',
      'attitude', 'character', 'personality', 'trait', 'nature', 'spirit', 'happy', 'happiness',
      'unhappy', 'glad', 'pleased', 'pleasure', 'pleasant', 'unpleasant', 'enjoy', 'enjoyable',
      'enjoyment', 'delight', 'delighted', 'delightful', 'cheerful', 'cheer', 'joy', 'joyful',
      'merry', 'thrilled', 'ecstatic', 'excited', 'exciting', 'excitement', 'enthusiastic',
      'enthusiasm', 'eager', 'keen', 'fond', 'adore', 'love', 'loving', 'affection', 'like',
      'admire', 'admiration', 'respect', 'respectful', 'proud', 'pride', 'confident',
      'confidence', 'self-confident', 'optimistic', 'optimism', 'pessimistic', 'hope', 'hopeful',
      'hopeless', 'grateful', 'gratitude', 'thankful', 'appreciate', 'appreciation', 'satisfied',
      'satisfaction', 'satisfactory', 'content', 'relief', 'relieved', 'comfort', 'comfortable',
      'uncomfortable', 'peaceful', 'calm', 'relaxed', 'sad', 'sadness', 'unhappy', 'upset',
      'miserable', 'misery', 'grief', 'sorrow', 'heartbroken', 'depressed', 'depressing',
      'depression', 'despair', 'desperate', 'disappointed', 'disappointing', 'disappointment',
      'frustrated', 'frustrating', 'frustration', 'regret', 'lonely', 'loneliness', 'homesick',
      'bored', 'boring', 'boredom', 'fed up', 'afraid', 'scared', 'scary', 'scare', 'frighten',
      'frightened', 'frightening', 'fear', 'fearful', 'fearless', 'terrify', 'terrified',
      'terrifying', 'terror', 'panic', 'horrified', 'horror', 'dread', 'nervous', 'anxious',
      'anxiety', 'worry', 'worried', 'worrying', 'uneasy', 'tense', 'tension', 'stress',
      'stressed', 'stressful', 'overwhelmed', 'angry', 'anger', 'mad', 'furious', 'rage',
      'annoy', 'annoyed', 'annoying', 'annoyance', 'irritate', 'irritated', 'irritating',
      'offend', 'offended', 'offensive', 'insult', 'hate', 'hatred', 'disgust', 'disgusted',
      'disgusting', 'bitter', 'hostile', 'resent', 'jealous', 'jealousy', 'envy', 'envious',
      'embarrass', 'embarrassed', 'embarrassing', 'embarrassment', 'ashamed', 'shame', 'humiliate',
      'guilt', 'guilty', 'shy', 'timid', 'modest', 'humble', 'surprise', 'surprised',
      'surprising', 'astonish', 'astonished', 'astonishing', 'amaze', 'amazed', 'amazing',
      'amazement', 'shock', 'shocked', 'shocking', 'stunned', 'wonder', 'wonderful', 'awesome',
      'impress', 'impressed', 'impressive', 'impression', 'move', 'moved', 'moving', 'touching',
      'confuse', 'confused', 'confusing', 'confusion', 'puzzled', 'hesitate', 'reluctant',
      'curious', 'curiosity', 'interest', 'interested', 'interesting', 'fascinate', 'fascinated',
      'fascinating', 'attract', 'attraction', 'attractive', 'charm', 'charming', 'care', 'caring',
      'careful', 'careless', 'cautious', 'sympathy', 'sympathetic', 'pity', 'mercy', 'kind',
      'unkind', 'kindness', 'nice', 'sweet', 'warm', 'friendly', 'unfriendly', 'welcoming',
      'polite', 'impolite', 'rude', 'courteous', 'manners', 'honest', 'dishonest', 'honesty',
      'sincere', 'genuine', 'frank', 'loyal', 'loyalty', 'faithful', 'trustworthy', 'reliable',
      'unreliable', 'responsible', 'irresponsible', 'generous', 'generosity', 'mean', 'greedy',
      'selfish', 'unselfish', 'patient', 'impatient', 'patience', 'tolerant', 'calm', 'quiet',
      'silent', 'talkative', 'outgoing', 'sociable', 'active', 'energetic', 'lively', 'lazy',
      'hard-working', 'diligent', 'industrious', 'ambitious', 'ambition', 'determined',
      'determination', 'stubborn', 'brave', 'bravery', 'courage', 'courageous', 'bold', 'daring',
      'heroic', 'coward', 'clever', 'smart', 'intelligent', 'intelligence', 'bright', 'brilliant',
      'genius', 'talented', 'talent', 'gifted', 'wise', 'wisdom', 'sensible', 'reasonable',
      'rational', 'logical', 'practical', 'realistic', 'creative', 'imaginative', 'mature',
      'immature', 'innocent', 'naive', 'silly', 'foolish', 'fool', 'stupid', 'idiot', 'ridiculous',
      'absurd', 'crazy', 'mad', 'insane', 'weird', 'strange', 'odd', 'peculiar', 'eccentric',
      'serious', 'strict', 'severe', 'tough', 'harsh', 'firm', 'gentle', 'mild', 'soft', 'tender',
      'cruel', 'brutal', 'violent', 'fierce', 'aggressive', 'aggression', 'evil', 'wicked', 'nasty'
    ]),
    viPhrases: [
      'cảm giác', 'cảm xúc', 'tâm trạng', 'đam mê', 'thái độ', 'tính cách', 'nhân cách',
      'hạnh phúc', 'vui vẻ', 'hài lòng', 'niềm vui', 'thích thú', 'phấn khích', 'hào hứng',
      'nhiệt tình', 'yêu thích', 'ngưỡng mộ', 'tôn trọng', 'tự hào', 'tự tin', 'lạc quan',
      'bi quan', 'hy vọng', 'biết ơn', 'trân trọng', 'nhẹ nhõm', 'thoải mái', 'bình yên',
      'buồn bã', 'nỗi buồn', 'đau khổ', 'trầm cảm', 'tuyệt vọng', 'thất vọng', 'chán nản',
      'hối tiếc', 'cô đơn', 'buồn chán', 'nhàm chán', 'sợ hãi', 'nỗi sợ', 'hoảng loạn',
      'kinh hoàng', 'lo lắng', 'bồn chồn', 'căng thẳng', 'tức giận', 'cơn giận', 'phẫn nộ',
      'khó chịu', 'bực bội', 'xúc phạm', 'căm ghét', 'ghê tởm', 'thù địch', 'ghen tị', 'đố kỵ',
      'xấu hổ', 'ngượng ngùng', 'tội lỗi', 'nhút nhát', 'khiêm tốn', 'ngạc nhiên', 'bất ngờ',
      'kinh ngạc', 'ấn tượng', 'xúc động', 'bối rối', 'do dự', 'miễn cưỡng', 'tò mò', 'hấp dẫn',
      'quyến rũ', 'quan tâm', 'cẩn thận', 'bất cẩn', 'thận trọng', 'đồng cảm', 'thương hại',
      'tốt bụng', 'thân thiện', 'lịch sự', 'bất lịch sự', 'thô lỗ', 'trung thực', 'thật thà',
      'chân thành', 'trung thành', 'đáng tin cậy', 'hào phóng', 'tham lam', 'ích kỷ',
      'kiên nhẫn', 'năng động', 'lười biếng', 'chăm chỉ', 'tham vọng', 'quyết tâm', 'bướng bỉnh',
      'dũng cảm', 'can đảm', 'tài năng', 'thông minh', 'khôn ngoan', 'hợp lý', 'sáng tạo',
      'trưởng thành', 'ngây thơ', 'ngốc nghếch', 'ngu ngốc', 'lố bịch', 'điên rồ', 'kỳ lạ',
      'nghiêm túc', 'nghiêm khắc', 'dịu dàng', 'độc ác', 'tàn nhẫn', 'hung hăng'
    ]
  },
  {
    id: 'mind_cognition_decisions',
    category: MACRO_CATEGORIES.MIND_ACTIONS_GRAMMAR,
    title: 'Suy nghĩ & Quyết định',
    unitTitles: ['Suy nghĩ & Trí nhớ', 'Ý kiến & Quan điểm', 'Lựa chọn & Quyết định'],
    enWords: new Set([
      'think', 'thinking', 'thought', 'thoughtful', 'mind', 'mental', 'intellect', 'intellectual',
      'reason', 'reasoning', 'logic', 'sense', 'idea', 'notion', 'concept', 'conception',
      'view', 'viewpoint', 'point of view', 'perspective', 'opinion', 'attitude', 'outlook',
      'standpoint', 'stance', 'position', 'belief', 'believe', 'convince', 'convinced',
      'convincing', 'persuade', 'persuasion', 'influence', 'inspire', 'inspiration', 'know',
      'known', 'unknown', 'realize', 'realise', 'realization', 'recognize', 'recognise',
      'recognition', 'understand', 'understanding', 'misunderstand', 'comprehend', 'grasp',
      'perceive', 'perception', 'aware', 'awareness', 'unaware', 'conscious', 'consciousness',
      'unconscious', 'notice', 'note', 'observe', 'detect', 'spot', 'discover', 'find',
      'identify', 'identification', 'distinguish', 'differentiate', 'tell', 'compare',
      'comparison', 'contrast', 'associate', 'association', 'relate', 'relation', 'connection',
      'remember', 'memory', 'memorize', 'remind', 'reminder', 'recall', 'recollect', 'forget',
      'forgotten', 'ignore', 'neglect', 'overlook', 'focus', 'concentrate', 'concentration',
      'attention', 'attentive', 'distract', 'distraction', 'absorb', 'absorbed', 'imagine',
      'imagination', 'imaginary', 'fantasy', 'dream', 'vision', 'invent', 'create', 'creativity',
      'wonder', 'question', 'doubt', 'doubtful', 'uncertain', 'certain', 'certainty', 'sure',
      'unsure', 'confident', 'suspect', 'suspicion', 'suspicious', 'trust', 'distrust',
      'suppose', 'assume', 'assumption', 'presume', 'guess', 'predict', 'prediction',
      'anticipate', 'expect', 'expectation', 'foresee', 'hope', 'wish', 'desire', 'long',
      'fancy', 'prefer', 'preference', 'favor', 'favour', 'favorite', 'favourite', 'choose',
      'choice', 'select', 'selection', 'pick', 'opt', 'option', 'optional', 'alternative',
      'decide', 'decision', 'decisive', 'determine', 'resolve', 'resolution', 'settle',
      'intend', 'intention', 'intentional', 'deliberate', 'deliberately', 'purpose', 'aim',
      'plan', 'planning', 'plot', 'scheme', 'consider', 'consideration', 'regard', 'take into account',
      'reckon', 'deem', 'judge', 'judgement', 'judgment', 'evaluate', 'assess', 'estimate',
      'appreciate', 'value', 'rate', 'solve', 'solution', 'resolve', 'figure out', 'work out',
      'deal with', 'cope', 'handle', 'manage', 'tackle', 'address', 'confront', 'face', 'accept',
      'acceptable', 'admit', 'acknowledge', 'agree', 'agreement', 'approve', 'approval', 'consent',
      'disagree', 'disagreement', 'object', 'objection', 'oppose', 'opposed', 'opposition',
      'reject', 'rejection', 'refuse', 'refusal', 'deny', 'denial', 'dismiss', 'compromise',
      'insight', 'intuition', 'instinct', 'conscience', 'motive', 'motivation', 'motivate', 'inspire'
    ]),
    viPhrases: [
      'suy nghĩ', 'tư duy', 'tâm trí', 'trí tuệ', 'lý trí', 'ý tưởng', 'quan niệm', 'khái niệm',
      'quan điểm', 'góc nhìn', 'ý kiến', 'niềm tin', 'tin tưởng', 'thuyết phục', 'ảnh hưởng',
      'truyền cảm hứng', 'nhận ra', 'công nhận', 'thấu hiểu', 'hiểu lầm', 'nhận thức', 'ý thức',
      'vô thức', 'phát hiện', 'nhận diện', 'phân biệt', 'so sánh', 'đối chiếu', 'liên tưởng',
      'ghi nhớ', 'trí nhớ', 'nhắc nhở', 'hồi tưởng', 'lãng quên', 'phớt lờ', 'bỏ bê', 'tập trung',
      'sự chú ý', 'phân tâm', 'tưởng tượng', 'trí tưởng tượng', 'sáng tạo', 'nghi ngờ', 'hoài nghi',
      'chắc chắn', 'nghi vấn', 'giả định', 'giả sử', 'phỏng đoán', 'dự đoán', 'mong đợi', 'kỳ vọng',
      'mong muốn', 'khao khát', 'ưa thích', 'lựa chọn', 'tùy chọn', 'thay thế', 'quyết định',
      'kiên quyết', 'ý định', 'cố ý', 'mục đích', 'kế hoạch', 'âm mưu', 'cân nhắc', 'xem xét',
      'phán xét', 'đánh giá', 'giải quyết', 'giải pháp', 'đối phó', 'xử lý', 'chấp nhận',
      'thừa nhận', 'đồng ý', 'chấp thuận', 'phản đối', 'từ chối', 'bác bỏ', 'phủ nhận', 'thỏa hiệp',
      'sâu sắc', 'trực giác', 'bản năng', 'lương tâm', 'động cơ', 'động lực'
    ]
  },
  {
    id: 'grammar_connectors_structure',
    category: MACRO_CATEGORIES.MIND_ACTIONS_GRAMMAR,
    title: 'Từ nối & Ngữ pháp',
    unitTitles: [
      'Đại từ & Từ sở hữu',
      'Từ hạn định & Lượng từ',
      'Giới từ vị trí',
      'Giới từ thời gian',
      'Từ nối & Liên từ',
      'Trợ động từ thông dụng',
      'Từ để hỏi & Giao tiếp'
    ],
    enWords: new Set([
      'a', 'an', 'a, an', 'the', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her',
      'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs', 'i', 'me', 'you', 'he',
      'him', 'she', 'it', 'we', 'us', 'they', 'them', 'myself', 'yourself', 'himself', 'herself',
      'itself', 'ourselves', 'yourselves', 'themselves', 'each other', 'one another', 'who',
      'whom', 'whose', 'which', 'what', 'whatever', 'whoever', 'whichever', 'where', 'wherever',
      'when', 'whenever', 'why', 'how', 'however', 'some', 'any', 'no', 'none', 'nothing',
      'nobody', 'no one', 'someone', 'somebody', 'something', 'somewhere', 'anyone', 'anybody',
      'anything', 'anywhere', 'everyone', 'everybody', 'everything', 'everywhere', 'each',
      'every', 'either', 'neither', 'both', 'all', 'another', 'other', 'others', 'such', 'same',
      'many', 'much', 'more', 'most', 'few', 'fewer', 'fewest', 'little', 'less', 'least',
      'several', 'enough', 'plenty', 'lot', 'lots', 'none', 'be', 'am', 'is', 'are', 'was',
      'were', 'been', 'being', 'have', 'has', 'had', 'having', 'have to', 'do', 'does', 'did',
      'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must', 'ought',
      'need', 'dare', 'used to', 'in', 'into', 'inside', 'within', 'on', 'onto', 'upon', 'at',
      'to', 'toward', 'towards', 'from', 'of', 'off', 'out', 'outside', 'over', 'above', 'under',
      'below', 'beneath', 'underneath', 'up', 'upwards', 'down', 'downwards', 'through',
      'throughout', 'across', 'along', 'around', 'round', 'about', 'by', 'near', 'nearby',
      'beside', 'besides', 'next to', 'between', 'among', 'amid', 'before', 'in front of',
      'behind', 'after', 'afterwards', 'since', 'until', 'till', 'during', 'for', 'with',
      'without', 'against', 'opposite', 'beyond', 'past', 'via', 'per', 'despite', 'in spite of',
      'instead', 'instead of', 'except', 'apart from', 'according to', 'because of', 'due to',
      'owing to', 'thanks to', 'as for', 'regarding', 'concerning', 'and', 'or', 'nor', 'but',
      'yet', 'so', 'for', 'because', 'as', 'since', 'although', 'though', 'even though',
      'even if', 'while', 'whilst', 'whereas', 'if', 'unless', 'whether', 'provided',
      'providing', 'supposing', 'in case', 'once', 'as soon as', 'as long as', 'so that',
      'in order to', 'therefore', 'thus', 'hence', 'consequently', 'as a result', 'furthermore',
      'moreover', 'besides', 'in addition', 'additionally', 'also', 'too', 'as well', 'either',
      'however', 'nevertheless', 'nonetheless', 'otherwise', 'instead', 'meanwhile', 'otherwise',
      'indeed', 'in fact', 'actually', 'namely', 'for example', 'for instance', 'overall',
      'in conclusion', 'to sum up', 'anyway', 'anyhow', 'somehow', 'there', 'here', 'not',
      'no', 'yes', 'ok', 'okay', 'all right', 'alright', 'please', 'thank', 'thanks', 'hello',
      'hi', 'goodbye', 'bye', 'sorry', 'excuse', 'pardon', 'welcome', 'congratulations'
    ]),
    viPhrases: [
      'mạo từ', 'đại từ', 'giới từ', 'liên từ', 'trợ động từ', 'từ hạn định', 'mặc dù',
      'tuy nhiên', 'do đó', 'vì vậy', 'hơn nữa', 'ngoài ra', 'ngược lại', 'trong khi đó',
      'bất cứ khi nào', 'bất cứ nơi đâu', 'bất cứ ai', 'bất cứ điều gì', 'chẳng hạn như'
    ]
  }
];

/**
 * CÁC NHÓM ĐỘNG TỪ, TÍNH TỪ & KHÁI NIỆM CHUYÊN BIỆT (Thay thế hoàn toàn thùng rác "Chung chung")
 */
const SPECIALIZED_FALLBACK_TOPICS = {
  VERBS_COMMUNICATION: {
    id: 'verbs_communication_social',
    category: MACRO_CATEGORIES.MIND_ACTIONS_GRAMMAR,
    title: 'Giao tiếp & Phản hồi',
    unitTitles: ['Giao tiếp & Trò chuyện', 'Thảo luận & Phản hồi', 'Thuyết phục & Biểu đạt']
  },
  VERBS_MOVEMENT_PHYSICAL: {
    id: 'verbs_movement_physical',
    category: MACRO_CATEGORIES.MIND_ACTIONS_GRAMMAR,
    title: 'Hoạt động hàng ngày',
    unitTitles: [
      'Hoạt động hàng ngày',
      'Chuyển động & Đi lại',
      'Thao tác & Cầm nắm',
      'Hành động & Tác động',
      'Sử dụng & Kết hợp'
    ]
  },
  VERBS_CHANGE_PROGRESS: {
    id: 'verbs_change_management',
    category: MACRO_CATEGORIES.MIND_ACTIONS_GRAMMAR,
    title: 'Thay đổi & Phát triển',
    unitTitles: ['Thay đổi & Phát triển', 'Tổ chức & Thực hiện', 'Quản lý & Vận hành', 'Kết nối & Duy trì']
  },
  ADJ_QUALITY_EVALUATION: {
    id: 'adj_quality_evaluation',
    category: MACRO_CATEGORIES.MIND_ACTIONS_GRAMMAR,
    title: 'Mô tả & Đặc điểm',
    unitTitles: [
      'Mô tả & Đặc điểm',
      'Tính chất & Trạng thái',
      'Đánh giá & Chất lượng',
      'Mức độ & Tầm quan trọng',
      'Khả năng & Điều kiện'
    ]
  },
  ADV_MANNER_DEGREE: {
    id: 'adv_manner_degree',
    category: MACRO_CATEGORIES.MIND_ACTIONS_GRAMMAR,
    title: 'Trạng từ thông dụng',
    unitTitles: ['Trạng từ cách thức', 'Trạng từ mức độ', 'Trạng từ nhấn mạnh']
  },
  NOUNS_CONCEPTS_SYSTEMS: {
    id: 'nouns_concepts_events',
    category: MACRO_CATEGORIES.MIND_ACTIONS_GRAMMAR,
    title: 'Sự việc & Khái niệm',
    unitTitles: [
      'Sự việc & Tình huống',
      'Vấn đề & Giải pháp',
      'Kết quả & Ảnh hưởng',
      'Khái niệm & Hệ thống',
      'Hiện tượng & Quy luật'
    ]
  }
};

// Tập từ khóa phân tách 3 nhóm Động từ chuyên biệt
const COMM_VERBS = new Set([
  'say', 'tell', 'speak', 'talk', 'ask', 'answer', 'reply', 'respond', 'call', 'shout', 'scream',
  'whisper', 'yell', 'cry', 'laugh', 'smile', 'greet', 'introduce', 'invite', 'offer', 'suggest',
  'propose', 'recommend', 'advise', 'warn', 'remind', 'promise', 'swear', 'apologize', 'apologise',
  'forgive', 'thank', 'praise', 'compliment', 'criticize', 'criticise', 'blame', 'accuse',
  'complain', 'protest', 'argue', 'quarrel', 'debate', 'discuss', 'negotiate', 'persuade',
  'convince', 'encourage', 'urge', 'beg', 'insist', 'demand', 'request', 'require', 'order',
  'command', 'instruct', 'direct', 'guide', 'lead', 'announce', 'declare', 'state', 'claim',
  'mention', 'refer', 'remark', 'comment', 'note', 'point out', 'explain', 'describe', 'define',
  'illustrate', 'express', 'communicate', 'convey', 'reveal', 'disclose', 'expose', 'confess',
  'admit', 'acknowledge', 'confirm', 'deny', 'refuse', 'reject', 'accept', 'agree', 'disagree',
  'approve', 'oppose', 'object', 'forbid', 'ban', 'permit', 'allow', 'let', 'inform', 'notify',
  'report', 'broadcast', 'publish', 'print', 'quote', 'translate', 'interpret', 'pronounce',
  'spell', 'read', 'write', 'sign', 'signal', 'wave', 'nod', 'point', 'stare', 'gaze', 'glance',
  'look', 'watch', 'see', 'hear', 'listen', 'sound', 'contact', 'share'
]);

const CHANGE_PROGRESS_VERBS = new Set([
  'become', 'get', 'grow', 'turn', 'change', 'alter', 'modify', 'adapt', 'adjust', 'transform',
  'convert', 'shift', 'switch', 'replace', 'substitute', 'exchange', 'develop', 'evolve',
  'progress', 'advance', 'improve', 'enhance', 'upgrade', 'reform', 'expand', 'extend',
  'enlarge', 'increase', 'rise', 'raise', 'boost', 'grow', 'spread', 'multiply', 'reduce',
  'decrease', 'decline', 'drop', 'fall', 'shrink', 'contract', 'limit', 'restrict', 'begin',
  'start', 'commence', 'initiate', 'launch', 'introduce', 'establish', 'found', 'create',
  'produce', 'generate', 'form', 'build', 'construct', 'make', 'prepare', 'arrange', 'organize',
  'organise', 'plan', 'design', 'set up', 'continue', 'keep', 'maintain', 'preserve', 'sustain',
  'retain', 'remain', 'stay', 'last', 'end', 'finish', 'complete', 'conclude', 'cease', 'stop',
  'quit', 'pause', 'suspend', 'cancel', 'abandon', 'succeed', 'achieve', 'accomplish', 'fulfill',
  'attain', 'gain', 'obtain', 'acquire', 'earn', 'win', 'fail', 'lose', 'miss', 'waste',
  'destroy', 'ruin', 'damage', 'harm', 'spoil', 'wreck', 'collapse', 'disappear', 'vanish',
  'fade', 'exist', 'live', 'survive', 'occur', 'happen', 'take place', 'arise', 'emerge',
  'appear', 'seem', 'tend', 'matter', 'count', 'depend', 'rely', 'belong', 'consist', 'contain',
  'include', 'involve', 'exclude', 'combine', 'unite', 'join', 'connect', 'link', 'attach',
  'separate', 'divide', 'split', 'sort', 'classify', 'manage', 'control', 'govern', 'rule',
  'regulate', 'operate', 'function', 'work', 'serve', 'use', 'utilize', 'apply', 'employ'
]);

/**
 * Chuẩn hóa từ tiếng Anh để tra cứu
 */
function cleanEnglishWord(rawWord) {
  return String(rawWord || '')
    .split(',')[0]
    .replace(/™/g, '')
    .replace(/’/g, "'")
    .trim()
    .toLowerCase();
}

/**
 * Kiểm tra xem nghĩa tiếng Việt có chứa cụm từ khóa (ít nhất 2 âm tiết, khớp ranh giới từ) hay không
 */
function matchesVietnamesePhrase(meaningVi, phrases) {
  if (!meaningVi || !phrases || phrases.length === 0) return false;
  const normalizedMeaning = ` ${String(meaningVi).toLowerCase().replace(/[.,;!?()[\]"'/]/g, ' ')} `;
  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i].toLowerCase().trim();
    if (phrase.includes(' ') && normalizedMeaning.includes(` ${phrase} `)) {
      return true;
    }
  }
  return false;
}

/**
 * 1. HÀM PHÂN LOẠI TỪ VỰNG VÀO CHỦ ĐỀ NGỮ NGHĨA CHÍNH XÁC
 */
function classifyCard(card) {
  const cleanWord = cleanEnglishWord(card.word);
  const fullWordLower = String(card.word || '').trim().toLowerCase();
  const senseLower = String(card.sense_note || '').trim().toLowerCase();
  const posLower = String(card.part_of_speech || '').trim().toLowerCase();
  const meaningLower = String(card.meaning_vi || '').trim().toLowerCase();

  // Xử lý đặc biệt các từ có sense_note dễ nhầm trước tiên
  if (cleanWord === 'bear' && senseLower.includes('deal with')) {
    return SUB_TOPICS.find((t) => t.id === 'mind_cognition_decisions');
  }
  if (cleanWord === 'bank' && senseLower.includes('river')) {
    return SUB_TOPICS.find((t) => t.id === 'nature_environment_animals');
  }

  // Ưu tiên 1: Nếu từ loại thuần túy là từ ngữ pháp (article, prep, conj, pron, det, modal v., auxiliary v.)
  const grammarPosTokens = [
    'indefinite article',
    'definite article',
    'article',
    'prep.',
    'conj.',
    'pron.',
    'det.',
    'exclam.',
    'modal v.',
    'auxiliary v.'
  ];
  const isPureGrammarPos =
    grammarPosTokens.some((tok) => posLower.includes(tok)) &&
    !posLower.includes('n.') &&
    !posLower.includes('adj.') &&
    !posLower.split(',').some((p) => p.trim() === 'v.');

  if (isPureGrammarPos) {
    return SUB_TOPICS.find((t) => t.id === 'grammar_connectors_structure');
  }

  // Ưu tiên 2: Nếu từ loại là Số đếm (number) -> Đưa vào Thời gian & Số đếm
  if (posLower.includes('number')) {
    return SUB_TOPICS.find((t) => t.id === 'time_numbers_measures');
  }

  // Ưu tiên 3: Khớp trực tiếp trong từ điển từ khóa tiếng Anh (enWords) của 13 Sub-topics
  for (let i = 0; i < SUB_TOPICS.length; i++) {
    const sub = SUB_TOPICS[i];
    if (sub.enWords.has(cleanWord) || sub.enWords.has(fullWordLower)) {
      return sub;
    }
  }

  // Ưu tiên 4: Khớp theo cụm từ tiếng Việt >= 2 âm tiết (an toàn, không bắt nhầm âm đơn)
  for (let i = 0; i < SUB_TOPICS.length; i++) {
    const sub = SUB_TOPICS[i];
    if (matchesVietnamesePhrase(meaningLower, sub.viPhrases)) {
      return sub;
    }
  }

  // Ưu tiên 5: Phân loại thông minh các từ còn lại theo Từ loại & Hậu tố ngữ nghĩa
  if (posLower.includes('v.')) {
    if (COMM_VERBS.has(cleanWord)) {
      return SPECIALIZED_FALLBACK_TOPICS.VERBS_COMMUNICATION;
    }
    if (CHANGE_PROGRESS_VERBS.has(cleanWord)) {
      return SPECIALIZED_FALLBACK_TOPICS.VERBS_CHANGE_PROGRESS;
    }
    return SPECIALIZED_FALLBACK_TOPICS.VERBS_MOVEMENT_PHYSICAL;
  }

  if (posLower.includes('adv.') && !posLower.includes('adj.') && !posLower.includes('n.')) {
    return SPECIALIZED_FALLBACK_TOPICS.ADV_MANNER_DEGREE;
  }

  if (posLower.includes('adj.')) {
    return SPECIALIZED_FALLBACK_TOPICS.ADJ_QUALITY_EVALUATION;
  }

  return SPECIALIZED_FALLBACK_TOPICS.NOUNS_CONCEPTS_SYSTEMS;
}

/**
 * 2. HÀM TÍNH ĐIỂM ĐỘ KHÓ (difficulty_score: 1..5 & difficulty_level: 'EASY' | 'MEDIUM' | 'HARD')
 * Dựa trên 4 tiêu chí:
 *  - Cấp độ CEFR nền (A1 -> B2)
 *  - Tính cụ thể có hình ảnh (image_url) vs. Từ trừu tượng (hậu tố -tion, -ment, -ness, -ity...)
 *  - Độ dài từ & độ phức tạp chính tả
 *  - Tính đa từ loại / đa nghĩa (sense_note)
 */
function calculateCardDifficulty(card, levelTag) {
  const cleanWord = cleanEnglishWord(card.word);
  const posLower = String(card.part_of_speech || '').toLowerCase();
  let rawScore = 1.0;

  // Tiêu chí 1: Điểm nền theo cấp độ CEFR
  if (levelTag === 'A1') rawScore = 1.2;
  else if (levelTag === 'A2') rawScore = 1.8;
  else if (levelTag === 'B1') rawScore = 2.4;
  else if (levelTag === 'B2') rawScore = 3.0;

  // Tiêu chí 2: Tính cụ thể (có ảnh minh họa) vs. Trừu tượng
  if (card.image_url) {
    rawScore -= 0.5;
  }
  if (/(tion|sion|ment|ness|ity|ism|ance|ence|ship|logy|tude)$/i.test(cleanWord)) {
    rawScore += 0.7;
  }
  if (posLower.includes('conj.') || posLower.includes('prep.') || posLower.includes('adv.')) {
    rawScore += 0.3;
  }

  // Tiêu chí 3: Độ dài từ & Độ phức tạp chính tả
  if (cleanWord.length <= 4) {
    rawScore -= 0.2;
  } else if (cleanWord.length >= 6 && cleanWord.length <= 8) {
    rawScore += 0.4;
  } else if (cleanWord.length >= 9) {
    rawScore += 0.9;
  }

  // Tiêu chí 4: Đa từ loại hoặc có sense_note phân biệt nghĩa
  const posCount = posLower.split(/[,/]/).filter(Boolean).length;
  if (posCount >= 2 || card.sense_note) {
    rawScore += 0.5;
  }

  // Quy đổi về thang điểm 1..5 sao
  const score = Math.max(1, Math.min(5, Math.round(rawScore)));

  let level = 'MEDIUM';
  if (score <= 2) {
    level = 'EASY';
  } else if (score >= 4) {
    level = 'HARD';
  }

  return {
    difficulty_score: score,
    difficulty_level: level,
    raw_score: Number(rawScore.toFixed(2))
  };
}

/**
 * 3. HÀM CHỌN 3 ĐÁP ÁN NHIỄU (distractors) CÙNG TỪ LOẠI & CÙNG CHỦ ĐỀ
 */
function buildSmartDistractors(cardsInTopic) {
  if (cardsInTopic.length < 4) return;

  for (let i = 0; i < cardsInTopic.length; i++) {
    const current = cardsInTopic[i];
    const primaryPos = String(current.part_of_speech || '')
      .split(/[,/]/)[0]
      .trim()
      .toLowerCase();

    const samePosCandidates = [];
    const otherCandidates = [];

    for (let j = 0; j < cardsInTopic.length; j++) {
      if (i === j) continue;
      const cand = cardsInTopic[j];
      if (cand.word === current.word || cand.meaning_vi === current.meaning_vi) continue;

      const candPos = String(cand.part_of_speech || '')
        .split(/[,/]/)[0]
        .trim()
        .toLowerCase();

      if (candPos && candPos === primaryPos) {
        samePosCandidates.push(cand);
      } else {
        otherCandidates.push(cand);
      }
    }

    const pool = [...samePosCandidates, ...otherCandidates];
    const picked = [];
    let step = 0;
    while (picked.length < 3 && step < pool.length) {
      const candidate = pool[(i + step * 2) % pool.length];
      if (!picked.some((p) => p.word === candidate.word)) {
        picked.push({
          word: candidate.word,
          meaning_vi: candidate.meaning_vi,
          phonetic: candidate.phonetic_primary || null
        });
      }
      step++;
    }

    if (picked.length === 3) {
      current.distractors = picked;
    }
  }
}

/**
 * 4. HÀM CHIA CÁC TỪ TRONG 1 CHỦ ĐỀ THÀNH CÁC UNIT (15 - 22 TỪ/UNIT)
 * Sắp xếp mỗi Unit theo thứ tự: EASY (có ảnh) -> MEDIUM -> HARD
 * Và đặt tên Unit kèm 3 từ vựng tiêu biểu để mỗi Unit có tên riêng biệt, không nhàm chán!
 */
function createUnitsForSubTopic(subTopic, cards) {
  if (cards.length === 0) return [];

  // Chia thành các chặng ~18-20 từ (tối đa 22 từ/Unit)
  const targetSize = 19;
  const numUnits = Math.max(1, Math.ceil(cards.length / 21));
  const chunkSize = Math.ceil(cards.length / numUnits);

  const units = [];

  for (let u = 0; u < numUnits; u++) {
    const slice = cards.slice(u * chunkSize, (u + 1) * chunkSize);
    if (slice.length === 0) continue;

    // Sắp xếp các từ bên trong Unit theo lộ trình:
    // 1. Độ khó tăng dần (EASY -> MEDIUM -> HARD)
    // 2. Trong cùng độ khó, ưu tiên từ có hình ảnh minh họa (image_url) lên đầu để tạo hứng thú
    // 3. Cuối cùng xếp theo bảng chữ cái A-Z
    slice.sort((a, b) => {
      const scoreDiff = (a.difficulty_score || 3) - (b.difficulty_score || 3);
      if (scoreDiff !== 0) return scoreDiff;

      const imgA = a.image_url ? 0 : 1;
      const imgB = b.image_url ? 0 : 1;
      if (imgA !== imgB) return imgA - imgB;

      return String(a.word || '').localeCompare(String(b.word || ''), 'en', {
        sensitivity: 'base'
      });
    });

    // Đặt tên Unit ngắn gọn, tự nhiên theo đúng chuẩn Parroto (2-3 từ, không nhồi nhét danh sách từ)
    let cleanUnitTitle = subTopic.title;
    if (Array.isArray(subTopic.unitTitles) && subTopic.unitTitles.length > 0) {
      if (u < subTopic.unitTitles.length) {
        cleanUnitTitle = subTopic.unitTitles[u];
      } else {
        cleanUnitTitle = `${subTopic.title} ${u + 1}`;
      }
    } else if (numUnits > 1) {
      cleanUnitTitle = `${subTopic.title} ${u + 1}`;
    }

    units.push({
      category_id: subTopic.category.id,
      category_name: subTopic.category.name,
      sub_topic_id: subTopic.id,
      base_title: subTopic.title,
      display_title: cleanUnitTitle,
      cards: slice
    });
  }

  return units;
}

// Thứ tự hiển thị cố định của tất cả Sub-topics theo đúng 5 Nhóm Chủ Đề Lớn
const ORDERED_SUB_TOPIC_IDS = [
  // Nhóm 1: Đời sống, Gia đình & Ẩm thực
  'family_relationships',
  'home_furniture',
  'clothing_materials',
  'food_cooking',
  // Nhóm 2: Di chuyển, Địa điểm & Giải trí
  'travel_transport',
  'places_geography',
  'arts_media_entertainment',
  'sports_games',
  // Nhóm 3: Công việc, Kinh tế & Giáo dục
  'work_career',
  'business_finance',
  'education_language_study',
  // Nhóm 4: Tự nhiên, Khoa học, Y tế & Xã hội
  'body_health_medicine',
  'nature_environment_animals',
  'science_tech_engineering',
  'society_law_politics',
  'time_numbers_measures',
  // Nhóm 5: Tư duy, Cảm xúc, Hành động & Ngữ pháp
  'feelings_emotions_personality',
  'mind_cognition_decisions',
  'verbs_communication_social',
  'verbs_movement_physical',
  'verbs_change_management',
  'adj_quality_evaluation',
  'adv_manner_degree',
  'nouns_concepts_events',
  'grammar_connectors_structure'
];

function runRebuildTaxonomy() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error('❌ Không tìm thấy file:', DATA_FILE);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  let grandTotalCards = 0;
  let grandTotalUnits = 0;
  const difficultyTotals = { EASY: 0, MEDIUM: 0, HARD: 0 };

  for (let l = 0; l < rawData.levels.length; l++) {
    const levelObj = rawData.levels[l];

    for (let d = 0; d < levelObj.decks.length; d++) {
      const deck = levelObj.decks[d];
      const levelTag = deck.level_tag || levelObj.cefr_level || 'A1';

      // 1. Gom toàn bộ các thẻ của cấp độ hiện tại
      const allDeckCards = [];
      for (let u = 0; u < deck.units.length; u++) {
        for (let c = 0; c < deck.units[u].cards.length; c++) {
          allDeckCards.push(deck.units[u].cards[c]);
        }
      }

      // 2. Tính độ khó & Phân loại từng thẻ vào Sub-topic
      const buckets = new Map();
      const subTopicMeta = new Map();

      for (let i = 0; i < allDeckCards.length; i++) {
        const card = allDeckCards[i];
        const subTopic = classifyCard(card);
        const diff = calculateCardDifficulty(card, levelTag);

        card.difficulty_score = diff.difficulty_score;
        card.difficulty_level = diff.difficulty_level;
        difficultyTotals[diff.difficulty_level]++;

        if (!card.language_metadata || typeof card.language_metadata !== 'object') {
          card.language_metadata = {};
        }
        card.language_metadata.difficulty_score = diff.difficulty_score;
        card.language_metadata.difficulty_level = diff.difficulty_level;
        card.language_metadata.category_id = subTopic.category.id;
        card.language_metadata.topic_category = subTopic.category.name;
        card.language_metadata.sub_topic_title = subTopic.title;

        if (!buckets.has(subTopic.id)) {
          buckets.set(subTopic.id, []);
          subTopicMeta.set(subTopic.id, subTopic);
        }
        buckets.get(subTopic.id).push(card);
      }

      // 3. Gom các nhóm quá nhỏ (< 8 từ) trong cùng 1 Macro Category lại để không bị Unit chỉ có 2-4 từ
      const orderedGroups = [];
      let pendingSmallCards = [];
      let pendingCategory = null;
      let pendingSubTopic = null;

      for (let s = 0; s < ORDERED_SUB_TOPIC_IDS.length; s++) {
        const subId = ORDERED_SUB_TOPIC_IDS[s];
        const cardsInSub = buckets.get(subId) || [];
        if (cardsInSub.length === 0) continue;

        const subTopic = subTopicMeta.get(subId);

        if (pendingCategory && pendingCategory.id !== subTopic.category.id && pendingSmallCards.length > 0) {
          // Nếu đổi sang Macro Category mới mà còn thẻ lẻ của Category cũ -> ghép vào nhóm trước đó cùng Category hoặc tạo 1 nhóm gọn
          if (orderedGroups.length > 0 && orderedGroups[orderedGroups.length - 1].subTopic.category.id === pendingCategory.id) {
            orderedGroups[orderedGroups.length - 1].cards.push(...pendingSmallCards);
          } else {
            orderedGroups.push({
              subTopic: pendingSubTopic,
              cards: pendingSmallCards
            });
          }
          pendingSmallCards = [];
          pendingCategory = null;
          pendingSubTopic = null;
        }

        if (cardsInSub.length < 8) {
          pendingSmallCards.push(...cardsInSub);
          pendingCategory = subTopic.category;
          if (!pendingSubTopic) pendingSubTopic = subTopic;

          if (pendingSmallCards.length >= 12) {
            orderedGroups.push({
              subTopic: {
                ...pendingSubTopic,
                title: pendingCategory.name,
                unitTitles: [pendingCategory.name]
              },
              cards: pendingSmallCards
            });
            pendingSmallCards = [];
            pendingCategory = null;
            pendingSubTopic = null;
          }
        } else {
          if (pendingSmallCards.length > 0 && pendingCategory && pendingCategory.id === subTopic.category.id) {
            cardsInSub.unshift(...pendingSmallCards);
            pendingSmallCards = [];
            pendingCategory = null;
            pendingSubTopic = null;
          }
          orderedGroups.push({
            subTopic,
            cards: cardsInSub
          });
        }
      }

      if (pendingSmallCards.length > 0 && pendingSubTopic) {
        if (orderedGroups.length > 0 && orderedGroups[orderedGroups.length - 1].subTopic.category.id === pendingCategory.id) {
          orderedGroups[orderedGroups.length - 1].cards.push(...pendingSmallCards);
        } else {
          orderedGroups.push({
            subTopic: {
              ...pendingSubTopic,
              title: pendingCategory.name,
              unitTitles: [pendingCategory.name]
            },
            cards: pendingSmallCards
          });
        }
      }

      // 4. Dựng danh sách Units theo thứ tự 5 Nhóm Chủ đề lớn
      const newUnits = [];
      let nextUnitNum = 1;

      for (let g = 0; g < orderedGroups.length; g++) {
        const { subTopic, cards: cardsInSub } = orderedGroups[g];

        // Tạo 3 đáp án nhiễu cùng từ loại & cùng chủ đề
        buildSmartDistractors(cardsInSub);

        // Chia thành các Unit (15-22 từ) và sắp xếp EASY -> MEDIUM -> HARD
        const createdUnits = createUnitsForSubTopic(subTopic, cardsInSub);

        for (let uIdx = 0; uIdx < createdUnits.length; uIdx++) {
          const uObj = createdUnits[uIdx];
          for (let cIdx = 0; cIdx < uObj.cards.length; cIdx++) {
            uObj.cards[cIdx].order_index = cIdx + 1;
          }

          newUnits.push({
            unit_number: nextUnitNum,
            category_id: uObj.category_id,
            category_name: uObj.category_name,
            title: uObj.display_title,
            card_count: uObj.cards.length,
            cards: uObj.cards
          });
          nextUnitNum++;
        }
      }

      deck.units = newUnits;
      deck.total_units = newUnits.length;
      deck.total_cards = allDeckCards.length;
      levelObj.total_words_in_level = allDeckCards.length;

      grandTotalCards += allDeckCards.length;
      grandTotalUnits += newUnits.length;

      console.log(
        `✅ Cấp độ ${levelTag}: ${allDeckCards.length} từ -> ${newUnits.length} Units theo 5 Nhóm Chủ đề lớn.`
      );
    }
  }

  rawData.total_unique_entries = grandTotalCards;
  rawData.organization_rule =
    'Phân tầng theo 4 cấp độ CEFR (A1-B2) -> 5 Nhóm Chủ đề lớn (Categories) -> Các bài học nhỏ (Units ~18-20 từ, sắp xếp từ Dễ -> Vừa -> Khó)';

  fs.writeFileSync(DATA_FILE, JSON.stringify(rawData, null, 2), 'utf-8');
  console.log('\n==================================================');
  console.log(`🎉 HOÀN TẤT TÁI CẤU TRÚC TAXONOMY & ĐỘ KHÓ CHO ${grandTotalCards} TỪ!`);
  console.log(`- Tổng số Units: ${grandTotalUnits}`);
  console.log(
    `- Phân bố Độ khó: 🟢 Dễ (EASY): ${difficultyTotals.EASY} | 🟡 Vừa (MEDIUM): ${difficultyTotals.MEDIUM} | 🔴 Khó (HARD): ${difficultyTotals.HARD}`
  );
  console.log('==================================================');
}

runRebuildTaxonomy();
