// Culturally-authentic cafe menus for each language
export const CAFE_MENUS = {
    tr: { // Turkish
        currency: '₺',
        categories: {
            'Sıcak İçecekler': [
                { name: 'Türk Kahvesi', price: '25', icon: '☕', description: 'Geleneksel Türk kahvesi' },
                { name: 'Çay', price: '10', icon: '🍵', description: 'Türk çayı' },
                { name: 'Nescafe', price: '20', icon: '☕', description: 'Nescafe' },
                { name: 'Sütlü Kahve', price: '30', icon: '☕', description: 'Süt ile' }
            ],
            'Soğuk İçecekler': [
                { name: 'Ayran', price: '15', icon: '🥛', description: 'Soğuk ayran' },
                { name: 'Limonata', price: '20', icon: '🍋', description: 'Taze sıkılmış' },
                { name: 'Buzlu Kahve', price: '35', icon: '🧊', description: 'Soğuk kahve' }
            ],
            'Atıştırmalıklar': [
                { name: 'Simit', price: '15', icon: '🥨', description: 'Susam simidi' },
                { name: 'Poğaça', price: '20', icon: '🥐', description: 'Peynirli poğaça' },
                { name: 'Börek', price: '35', icon: '🥟', description: 'Su böreği' }
            ]
        }
    },
    en: { // English
        currency: '£',
        categories: {
            'Hot Drinks': [
                { name: 'Espresso', price: '2.50', icon: '☕', description: 'Strong Italian coffee' },
                { name: 'Cappuccino', price: '3.50', icon: '☕', description: 'Espresso with foamed milk' },
                { name: 'Latte', price: '3.80', icon: '☕', description: 'Espresso with steamed milk' },
                { name: 'English Tea', price: '2.20', icon: '🍵', description: 'Classic black tea' }
            ],
            'Cold Drinks': [
                { name: 'Iced Coffee', price: '4.00', icon: '🧊', description: 'Cold brew coffee' },
                { name: 'Lemonade', price: '3.00', icon: '🍋', description: 'Freshly squeezed' },
                { name: 'Orange Juice', price: '3.50', icon: '🍊', description: 'Fresh OJ' }
            ],
            'Pastries': [
                { name: 'Croissant', price: '2.80', icon: '🥐', description: 'Butter croissant' },
                { name: 'Muffin', price: '2.50', icon: '🧁', description: 'Blueberry muffin' },
                { name: 'Scone', price: '2.60', icon: '🍪', description: 'With jam and cream' }
            ]
        }
    },
    es: { // Spanish
        currency: '€',
        categories: {
            'Bebidas Calientes': [
                { name: 'Café con Leche', price: '2.50', icon: '☕', description: 'Café con leche caliente' },
                { name: 'Cortado', price: '1.80', icon: '☕', description: 'Café espresso con leche' },
                { name: 'Chocolate Caliente', price: '3.00', icon: '🍫', description: 'Chocolate espeso' },
                { name: 'Té', price: '2.00', icon: '🍵', description: 'Té negro o verde' }
            ],
            'Bebidas Frías': [
                { name: 'Horchata', price: '2.50', icon: '🥛', description: 'Horchata de chufa' },
                { name: 'Café con Hielo', price: '2.80', icon: '🧊', description: 'Café frío' },
                { name: 'Limonada', price: '2.20', icon: '🍋', description: 'Limón fresco' }
            ],
            'Comida': [
                { name: 'Churros', price: '3.50', icon: '🥨', description: 'Con azúcar' },
                { name: 'Tostada', price: '2.50', icon: '🍞', description: 'Con tomate y aceite' },
                { name: 'Croissant', price: '2.00', icon: '🥐', description: 'Mantequilla' }
            ]
        }
    },
    fr: { // French
        currency: '€',
        categories: {
            'Boissons Chaudes': [
                { name: 'Espresso', price: '2.00', icon: '☕', description: 'Café court' },
                { name: 'Café Crème', price: '3.50', icon: '☕', description: 'Café avec crème' },
                { name: 'Chocolat Chaud', price: '3.80', icon: '🍫', description: 'Chocolat onctueux' },
                { name: 'Thé', price: '2.50', icon: '🍵', description: 'Thé noir ou vert' }
            ],
            'Boissons Froides': [
                { name: 'Café Glacé', price: '4.00', icon: '🧊', description: 'Café froid' },
                { name: 'Citronnade', price: '3.00', icon: '🍋', description: 'Citron pressé' },
                { name: 'Jus d\'Orange', price: '3.50', icon: '🍊', description: 'Jus frais' }
            ],
            'Pâtisseries': [
                { name: 'Croissant', price: '1.80', icon: '🥐', description: 'Croissant au beurre' },
                { name: 'Pain au Chocolat', price: '2.00', icon: '🍫', description: 'Chocolatine' },
                { name: 'Macaron', price: '2.50', icon: '🍪', description: 'Assortiment' }
            ]
        }
    },
    de: { // German
        currency: '€',
        categories: {
            'Heißgetränke': [
                { name: 'Kaffee', price: '2.50', icon: '☕', description: 'Filterkaffee' },
                { name: 'Cappuccino', price: '3.50', icon: '☕', description: 'Mit Milchschaum' },
                { name: 'Heiße Schokolade', price: '3.80', icon: '🍫', description: 'Cremige Schokolade' },
                { name: 'Tee', price: '2.20', icon: '🍵', description: 'Schwarztee' }
            ],
            'Kaltgetränke': [
                { name: 'Eiskaffee', price: '4.00', icon: '🧊', description: 'Kalter Kaffee' },
                { name: 'Limonade', price: '3.00', icon: '🍋', description: 'Zitronenlimonade' },
                { name: 'Orangensaft', price: '3.50', icon: '🍊', description: 'Frisch gepresst' }
            ],
            'Gebäck': [
                { name: 'Brezel', price: '2.00', icon: '🥨', description: 'Laugenbrezel' },
                { name: 'Croissant', price: '2.50', icon: '🥐', description: 'Buttercroissant' },
                { name: 'Apple strudel', price: '3.50', icon: '🍎', description: 'Mit Vanillesauce' }
            ]
        }
    },
    it: { // Italian
        currency: '€',
        categories: {
            'Bevande Calde': [
                { name: 'Espresso', price: '1.50', icon: '☕', description: 'Caffè espresso' },
                { name: 'Cappuccino', price: '2.50', icon: '☕', description: 'Con schiuma' },
                { name: 'Caffè Latte', price: '2.80', icon: '☕', description: 'Con latte' },
                { name: 'Cioccolata Calda', price: '3.50', icon: '🍫', description: 'Cioccolato denso' }
            ],
            'Bevande Fredde': [
                { name: 'Caffè Freddo', price: '3.00', icon: '🧊', description: 'Caffè ghiacciato' },
                { name: 'Limonata', price: '2.50', icon: '🍋', description: 'Limone fresco' },
                { name: 'Spremuta', price: '3.50', icon: '🍊', description: 'Arancia fresca' }
            ],
            'Dolci': [
                { name: 'Cornetto', price: '1.80', icon: '🥐', description: 'Cornetto vuoto' },
                { name: 'Tiramisù', price: '4.50', icon: '🍰', description: 'Dolce tradizionale' },
                { name: 'Biscotti', price: '2.00', icon: '🍪', description: 'Biscotti assortiti' }
            ]
        }
    },
    pt: { // Portuguese
        currency: '€',
        categories: {
            'Bebidas Quentes': [
                { name: 'Café', price: '1.20', icon: '☕', description: 'Café expresso' },
                { name: 'Galão', price: '2.50', icon: '☕', description: 'Café com leite' },
                { name: 'Chocolate Quente', price: '3.00', icon: '🍫', description: 'Chocolate cremoso' },
                { name: 'Chá', price: '1.80', icon: '🍵', description: 'Chá preto' }
            ],
            'Bebidas Frias': [
                { name: 'Café Gelado', price: '3.00', icon: '🧊', description: 'Café frio' },
                { name: 'Limonada', price: '2.50', icon: '🍋', description: 'Limão fresco' },
                { name: 'Sumo de Laranja', price: '3.00', icon: '🍊', description: 'Sumo natural' }
            ],
            'Pastelaria': [
                { name: 'Pastel de Nata', price: '1.50', icon: '🥧', description: 'Doce tradicional' },
                { name: 'Croissant', price: '1.80', icon: '🥐', description: 'Croissant simples' },
                { name: 'Bolo', price: '2.50', icon: '🍰', description: 'Fatia de bolo' }
            ]
        }
    },
    ru: { // Russian
        currency: '₽',
        categories: {
            'Горячие Напитки': [
                { name: 'Эспрессо', price: '150', icon: '☕', description: 'Крепкий кофе' },
                { name: 'Капучино', price: '200', icon: '☕', description: 'С молочной пеной' },
                { name: 'Латте', price: '220', icon: '☕', description: 'Кофе с молоком' },
                { name: 'Чай', price: '120', icon: '🍵', description: 'Черный чай' }
            ],
            'Холодные Напитки': [
                { name: 'Холодный Кофе', price: '250', icon: '🧊', description: 'Кофе со льдом' },
                { name: 'Лимонад', price: '180', icon: '🍋', description: 'Свежий лимонад' },
                { name: 'Сок', price: '200', icon: '🍊', description: 'Апельсиновый сок' }
            ],
            'Выпечка': [
                { name: 'Круассан', price: '150', icon: '🥐', description: 'Сливочный круассан' },
                { name: 'Пирожное', price: '180', icon: '🧁', description: 'Сладкое пирожное' },
                { name: 'Блины', price: '220', icon: '🥞', description: 'С медом' }
            ]
        }
    },
    ar: { // Arabic
        currency: '﷼',
        categories: {
            'المشروبات الساخنة': [
                { name: 'قهوة عربية', price: '15', icon: '☕', description: 'قهوة تقليدية' },
                { name: 'كابتشينو', price: '20', icon: '☕', description: 'مع الحليب' },
                { name: 'شاي', price: '10', icon: '🍵', description: 'شاي بالنعناع' },
                { name: 'شوكولاتة ساخنة', price: '22', icon: '🍫', description: 'شوكولاتة كريمية' }
            ],
            'المشروبات الباردة': [
                { name: 'قهوة مثلجة', price: '25', icon: '🧊', description: 'قهوة باردة' },
                { name: 'عصير ليمون', price: '18', icon: '🍋', description: 'ليمون طازج' },
                { name: 'عصير برتقال', price: '20', icon: '🍊', description: 'برتقال طبيعي' }
            ],
            'المعجنات': [
                { name: 'كرواسون', price: '12', icon: '🥐', description: 'كرواسون بالزبدة' },
                { name: 'كعك', price: '15', icon: '🧁', description: 'كعكة حلوة' },
                { name: 'بقلاوة', price: '18', icon: '🍰', description: 'حلوى عربية' }
            ]
        }
    },
    hi: { // Hindi
        currency: '₹',
        categories: {
            'गर्म पेय': [
                { name: 'चाय', price: '30', icon: '🍵', description: 'भारतीय चाय' },
                { name: 'कॉफी', price: '50', icon: '☕', description: 'फिल्टर कॉफी' },
                { name: 'कैपुचिनो', price: '80', icon: '☕', description: 'दूध के साथ' },
                { name: 'मसाला चाय', price: '40', icon: '🍵', description: 'मसाले के साथ चाय' }
            ],
            'ठंडे पेय': [
                { name: 'आइस कॉफी', price: '90', icon: '🧊', description: 'ठंडी कॉफी' },
                { name: 'निंबू पानी', price: '35', icon: '🍋', description: 'ताज़ा नींबू' },
                { name: 'लस्सी', price: '60', icon: '🥛', description: 'दही की लस्सी' }
            ],
            'स्नैक्स': [
                { name: 'समोसा', price: '20', icon: '🥟', description: 'तला हुआ स्नैक' },
                { name: 'बिस्किट', price: '30', icon: '🍪', description: 'मीठा बिस्किट' },
                { name: 'केक', price: '70', icon: '🍰', description: 'चॉकलेट केक' }
            ]
        }
    },
    ja: { // Japanese
        currency: '¥',
        categories: {
            'ホットドリンク': [
                { name: 'コーヒー', price: '400', icon: '☕', description: 'ブレンドコーヒー' },
                { name: 'カフェラテ', price: '500', icon: '☕', description: 'ミルク入り' },
                { name: '抹茶ラテ', price: '550', icon: '🍵', description: '抹茶ミルク' },
                { name: '緑茶', price: '300', icon: '🍵', description: '日本茶' }
            ],
            'アイスドリンク': [
                { name: 'アイスコーヒー', price: '450', icon: '🧊', description: '冷たいコーヒー' },
                { name: 'レモネード', price: '400', icon: '🍋', description: 'レモンジュース' },
                { name: 'アイスティー', price: '400', icon: '🧊', description: '冷たいお茶' }
            ],
            '軽食': [
                { name: 'サンドイッチ', price: '600', icon: '🥪', description: 'ハムサンド' },
                { name: 'クロワッサン', price: '350', icon: '🥐', description: 'バタークロワッサン' },
                { name: 'ケーキ', price: '500', icon: '🍰', description: 'ショートケーキ' }
            ]
        }
    },
    ko: { // Korean
        currency: '₩',
        categories: {
            '뜨거운음료': [
                { name: '아메리카노', price: '4500', icon: '☕', description: '에스프레소 커피' },
                { name: '카페라떼', price: '5000', icon: '☕', description: '우유 커피' },
                { name: '녹차라떼', price: '5500', icon: '🍵', description: '녹차 우유' },
                { name: '전통차', price: '4000', icon: '🍵', description: '한국 전통차' }
            ],
            '차가운음료': [
                { name: '아이스아메리카노', price: '4500', icon: '🧊', description: '차가운 커피' },
                { name: '레모네이드', price: '4500', icon: '🍋', description: '레몬 주스' },
                { name: '아이스티', price: '4000', icon: '🧊', description: '차가운 차' }
            ],
            '간식': [
                { name: '샌드위치', price: '6500', icon: '🥪', description: '햄 샌드위치' },
                { name: '크로와상', price: '4000', icon: '🥐', description: '버터 크로와상' },
                { name: '케이크', price: '5500', icon: '🍰', description: '딸기 케이크' }
            ]
        }
    },
    zh: { // Chinese
        currency: '¥',
        categories: {
            '热饮': [
                { name: '美式咖啡', price: '25', icon: '☕', description: '黑咖啡' },
                { name: '拿铁', price: '30', icon: '☕', description: '牛奶咖啡' },
                { name: '奶茶', price: '28', icon: '🧋', description: '珍珠奶茶' },
                { name: '绿茶', price: '20', icon: '🍵', description: '中国绿茶' }
            ],
            '冷饮': [
                { name: '冰咖啡', price: '28', icon: '🧊', description: '冰镇咖啡' },
                { name: '柠檬水', price: '22', icon: '🍋', description: '新鲜柠檬' },
                { name: '果汁', price: '25', icon: '🍊', description: '鲜榨果汁' }
            ],
            '小吃': [
                { name: '三明治', price: '35', icon: '🥪', description: '火腿三明治' },
                { name: '可颂', price: '18', icon: '🥐', description: '黄油可颂' },
                { name: '蛋糕', price: '30', icon: '🍰', description: '水果蛋糕' }
            ]
        }
    }
};
