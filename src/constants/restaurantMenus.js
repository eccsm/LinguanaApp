// Restaurant menus with appetizers, mains, desserts, and drinks
export const RESTAURANT_MENUS = {
    tr: {
        currency: '₺',
        categories: {
            'Mezeler': [
                { name: 'Humus', price: '45', icon: '🥙', description: 'Nohut ezmesi' },
                { name: 'Cacık', price: '35', icon: '🥒', description: 'Yoğurt ve salatalık' },
                { name: 'Sarma', price: '55', icon: '🍃', description: 'Yaprak sarması' },
                { name: 'Çoban Salata', price: '40', icon: '🥗', description: 'Taze sebze salatası' }
            ],
            'Ana Yemekler': [
                { name: 'İskender Kebap', price: '180', icon: '🥩', description: 'Döner, yoğurt, domates sosu' },
                { name: 'Adana Kebap', price: '165', icon: '🍢', description: 'Kıymalı kebap' },
                { name: 'Mantı', price: '120', icon: '🥟', description: 'Türk mantısı' },
                { name: 'Balık Izgara', price: '220', icon: '🐟', description: 'Günün taze balığı' }
            ],
            'Tatlılar': [
                { name: 'Baklava', price: '65', icon: '🍰', description: 'Antep fıstıklı' },
                { name: 'Künefe', price: '75', icon: '🧀', description: 'Peynirli tatlı' },
                { name: 'Sütlaç', price: '45', icon: '🍮', description: 'Fırın sütlaç' }
            ],
            'İçecekler': [
                { name: 'Ayran', price: '20', icon: '🥛', description: 'Ev yapımı' },
                { name: 'Şalgam', price: '25', icon: '🥤', description: 'Acılı şalgam' },
                { name: 'Türk Kahvesi', price: '30', icon: '☕', description: 'Geleneksel' }
            ]
        }
    },
    en: {
        currency: '£',
        categories: {
            'Starters': [
                { name: 'Caesar Salad', price: '8.50', icon: '🥗', description: 'Romaine, parmesan, croutons' },
                { name: 'Soup of the Day', price: '6.50', icon: '🍲', description: "Ask server for today's soup" },
                { name: 'Garlic Bread', price: '5.50', icon: '🥖', description: 'With herb butter' },
                { name: 'Calamari', price: '9.50', icon: '🦑', description: 'Fried with aioli' }
            ],
            'Main Courses': [
                { name: 'Fish & Chips', price: '15.50', icon: '🐟', description: 'Beer-battered cod' },
                { name: 'Steak & Ale Pie', price: '14.50', icon: '🥧', description: 'With mash and gravy' },
                { name: 'Roast Chicken', price: '16.50', icon: '🍗', description: 'With roast potatoes' },
                { name: 'Vegetable Curry', price: '13.50', icon: '🍛', description: 'Vegan option' }
            ],
            'Desserts': [
                { name: 'Sticky Toffee Pudding', price: '6.50', icon: '🍰', description: 'With vanilla ice cream' },
                { name: 'Cheesecake', price: '6.00', icon: '🍰', description: 'New York style' },
                { name: 'Ice Cream', price: '5.50', icon: '🍦', description: '3 scoops' }
            ],
            'Drinks': [
                { name: 'Soft Drink', price: '3.50', icon: '🥤', description: 'Coke, Sprite, etc.' },
                { name: 'Fresh Juice', price: '4.50', icon: '🍊', description: 'Orange or apple' },
                { name: 'Coffee', price: '3.00', icon: '☕', description: 'Espresso or filter' }
            ]
        }
    },
    es: {
        currency: '€',
        categories: {
            'Entrantes': [
                { name: 'Jamón Ibérico', price: '12.00', icon: '🥓', description: 'Jamón de bellota' },
                { name: 'Gazpacho', price: '6.50', icon: '🍅', description: 'Sopa fría andaluza' },
                { name: 'Patatas Bravas', price: '7.00', icon: '🥔', description: 'Con salsa brava' },
                { name: 'Croquetas', price: '8.50', icon: '🥟', description: 'De jamón' }
            ],
            'Platos Principales': [
                { name: 'Paella Valenciana', price: '18.50', icon: '🥘', description: 'Arroz con pollo y mariscos' },
                { name: 'Cordero Asado', price: '22.00', icon: '🍖', description: 'Al horno con hierbas' },
                { name: 'Pescado del Día', price: '19.50', icon: '🐟', description: 'A la plancha' },
                { name: 'Tortilla Española', price: '12.00', icon: '🥚', description: 'Con patatas' }
            ],
            'Postres': [
                { name: 'Flan', price: '5.50', icon: '🍮', description: 'Casero con caramelo' },
                { name: 'Churros', price: '6.00', icon: '🥨', description: 'Con chocolate' },
                { name: 'Tarta de Santiago', price: '6.50', icon: '🍰', description: 'Tarta de almendras' }
            ],
            'Bebidas': [
                { name: 'Sangría', price: '5.50', icon: '🍷', description: 'Tinto de verano' },
                { name: 'Agua con Gas', price: '2.50', icon: '💧', description: 'Agua mineral' },
                { name: 'Café', price: '2.00', icon: '☕', description: 'Solo o con leche' }
            ]
        }
    },
    fr: {
        currency: '€',
        categories: {
            'Entrées': [
                { name: "Soupe à l'Oignon", price: '7.50', icon: '🍲', description: 'Gratinée au fromage' },
                { name: 'Escargots', price: '12.00', icon: '🐌', description: 'Au beurre persillé' },
                { name: 'Foie Gras', price: '15.00', icon: '🦆', description: 'Avec pain grillé' },
                { name: 'Salade Niçoise', price: '9.50', icon: '🥗', description: 'Thon, œuf, olives' }
            ],
            'Plats Principaux': [
                { name: 'Coq au Vin', price: '19.50', icon: '🍗', description: 'Poulet au vin rouge' },
                { name: 'Boeuf Bourguignon', price: '22.00', icon: '🥩', description: 'Bœuf mijoté' },
                { name: 'Sole Meunière', price: '24.00', icon: '🐟', description: 'Poisson au beurre' },
                { name: 'Ratatouille', price: '16.50', icon: '🍆', description: 'Légumes provençaux' }
            ],
            'Desserts': [
                { name: 'Crème Brûlée', price: '7.50', icon: '🍮', description: 'Crème caramélisée' },
                { name: 'Tarte Tatin', price: '8.00', icon: '🍎', description: 'Tarte aux pommes' },
                { name: 'Profiteroles', price: '7.00', icon: '🍰', description: 'Sauce chocolat' }
            ],
            'Boissons': [
                { name: 'Vin Rouge', price: '6.50', icon: '🍷', description: 'Verre de vin' },
                { name: 'Eau Minérale', price: '3.50', icon: '💧', description: 'Plate ou gazeuse' },
                { name: 'Café', price: '3.00', icon: '☕', description: 'Expresso' }
            ]
        }
    },
    it: {
        currency: '€',
        categories: {
            'Antipasti': [
                { name: 'Bruschetta', price: '5.00', icon: '🍞', description: 'Pane tostato con pomodoro' },
                { name: 'Caprese', price: '7.00', icon: '🥗', description: 'Mozzarella, pomodoro, basilico' },
                { name: 'Prosciutto e Melone', price: '8.50', icon: '🍈', description: 'Prosciutto crudo e melone' }
            ],
            'Primi Piatti': [
                { name: 'Spaghetti Carbonara', price: '12.00', icon: '🍝', description: 'Uova, pecorino, guanciale' },
                { name: 'Risotto ai Funghi', price: '13.50', icon: '🍚', description: 'Riso, funghi porcini' },
                { name: 'Lasagne alla Bolognese', price: '14.00', icon: '🥘', description: 'Strati di pasta, ragù, besciamella' }
            ],
            'Secondi Piatti': [
                { name: 'Pollo alla Cacciatora', price: '15.00', icon: '🍗', description: 'Pollo in salsa di pomodoro' },
                { name: 'Bistecca alla Fiorentina', price: '25.00', icon: '🥩', description: 'Taglio di manzo alla griglia' }
            ],
            'Dolci': [
                { name: 'Tiramisù', price: '6.00', icon: '🍰', description: 'Mascarpone, caffè, cacao' },
                { name: 'Panna Cotta', price: '5.50', icon: '🍮', description: 'Crema cotta al caramello' }
            ],
            'Bevande': [
                { name: 'Acqua', price: '2.00', icon: '💧', description: 'Naturale o frizzante' },
                { name: 'Vino Rosso', price: '6.00', icon: '🍷', description: 'Rosso locale' },
                { name: 'Caffè', price: '2.50', icon: '☕', description: 'Espresso' }
            ]
        }
    },
    pt: {
        currency: '€',
        categories: {
            'Entradas': [
                { name: 'Pastéis de Bacalhau', price: '6.00', icon: '🐟', description: 'Bolinho de bacalhau' },
                { name: 'Caldo Verde', price: '5.00', icon: '🥣', description: 'Sopa de couve com chouriço' }
            ],
            'Pratos Principais': [
                { name: 'Bacalhau à Brás', price: '14.00', icon: '🐟', description: 'Bacalhau desfiado com batata e ovos' },
                { name: 'Frango Piri‑Piri', price: '13.00', icon: '🍗', description: 'Frango grelhado com molho picante' }
            ],
            'Sobremesas': [
                { name: 'Pastel de Nata', price: '3.50', icon: '🥧', description: 'Tartelete de creme' },
                { name: 'Arroz Doce', price: '4.00', icon: '🍚', description: 'Arroz com canela' }
            ],
            'Bebidas': [
                { name: 'Vinho Verde', price: '5.00', icon: '🍷', description: 'Vinho jovem e refrescante' },
                { name: 'Café', price: '2.00', icon: '☕', description: 'Café expresso' }
            ]
        }
    },
    ja: {
        currency: '¥',
        categories: {
            '前菜': [
                { name: '枝豆', price: '300', icon: '🥢', description: '塩茹で大豆' },
                { name: '味噌汁', price: '250', icon: '🥣', description: '豆腐とわかめ' }
            ],
            '主菜': [
                { name: '寿司盛り合わせ', price: '1800', icon: '🍣', description: '握りと巻き寿司' },
                { name: '天ぷら', price: '1500', icon: '🍤', description: 'エビと野菜の揚げ物' }
            ],
            'デザート': [
                { name: '抹茶アイスクリーム', price: '500', icon: '🍨', description: '抹茶風味' },
                { name: 'あんみつ', price: '600', icon: '🍧', description: '寒天とフルーツ' }
            ],
            '飲み物': [
                { name: '緑茶', price: '200', icon: '🍵', description: '熱い緑茶' },
                { name: 'ビール', price: '500', icon: '🍺', description: '日本のビール' }
            ]
        }
    },
    ko: {
        currency: '₩',
        categories: {
            '전채': [
                { name: '김치전', price: '4000', icon: '🥞', description: '김치와 부침가루' },
                { name: '된장찌개', price: '3500', icon: '🥣', description: '된장과 두부' }
            ],
            '주 요리': [
                { name: '불고기', price: '12000', icon: '🥩', description: '양념 소고기 구이' },
                { name: '비빔밥', price: '10000', icon: '🍚', description: '밥과 나물, 고추장' }
            ],
            '디저트': [
                { name: '호떡', price: '3000', icon: '🥞', description: '달콤한 시럽' },
                { name: '팥빙수', price: '8000', icon: '🍨', description: '얼음과 팥' }
            ],
            '음료': [
                { name: '소주', price: '5000', icon: '🥃', description: '전통 증류주' },
                { name: '식혜', price: '2500', icon: '🍶', description: '달콤한 전통 음료' }
            ]
        }
    },
    zh: {
        currency: '¥',
        categories: {
            '前菜': [
                { name: '春卷', price: '12', icon: '🥟', description: '蔬菜卷' },
                { name: '酸辣汤', price: '10', icon: '🍲', description: '酸辣味汤' }
            ],
            '主菜': [
                { name: '宫保鸡丁', price: '28', icon: '🍗', description: '鸡肉配花生' },
                { name: '麻婆豆腐', price: '22', icon: '🍲', description: '辣味豆腐' }
            ],
            '甜点': [
                { name: '芒果布丁', price: '15', icon: '🍮', description: '芒果味布丁' },
                { name: '红豆汤', price: '12', icon: '🍧', description: '甜红豆汤' }
            ],
            '饮品': [
                { name: '果汁', price: '5', icon: '🥤', description: '果汁' },
                { name: '绿茶', price: '3', icon: '🍵', description: '绿茶' }
            ]
        }
    },
    de: {
        currency: '€',
            categories: {
            'Vorspeisen': [
                { name: 'Brezelsuppe', price: '6.50', icon: '🥨', description: 'Brezel mit Käse' },
                { name: 'Wurst', price: '8.00', icon: '🌭', description: 'Deutsche Wurst' },
                { name: 'Sauerkraut', price: '5.50', icon: '🥬', description: 'Fermentierter Kohl' }
            ],
                'Hauptgerichte': [
                    { name: 'Schnitzel', price: '16.50', icon: '🥩', description: 'Paniertes Schweinefleisch' },
                    { name: 'Bratwurst', price: '12.00', icon: '🌭', description: 'Gegrillte Wurst' },
                    { name: 'Sauerbraten', price: '18.50', icon: '🥩', description: 'Mariniertes Rindfleisch' }
                ],
                    'Nachspeisen': [
                        { name: 'Schwarzwälder Kirschtorte', price: '6.50', icon: '🍰', description: 'Schokoladenkuchen' },
                        { name: 'Apfelstrudel', price: '5.50', icon: '🍎', description: 'Apfelkuchen' }
                    ],
                        'Getränke': [
                            { name: 'Bier', price: '4.50', icon: '🍺', description: 'Deutsches Bier' },
                            { name: 'Wasser', price: '2.50', icon: '💧', description: 'Mineralwasser' }
                        ]
        }
    },
    ru: {
        currency: '₽',
            categories: {
            'Закуски': [
                { name: 'Борщ', price: '250', icon: '🍲', description: 'Свекольный суп' },
                { name: 'Салат Оливье', price: '180', icon: '🥗', description: 'Традиционный салат' },
                { name: 'Пельмени', price: '220', icon: '🥟', description: 'Мясные пельмени' }
            ],
                'Основные Блюда': [
                    { name: 'Бефстроганов', price: '450', icon: '🥩', description: 'Говядина в сметане' },
                    { name: 'Котлеты по-киевски', price: '420', icon: '🍗', description: 'Куриные котлеты' },
                    { name: 'Голубцы', price: '350', icon: '🥬', description: 'Фаршированная капуста' }
                ],
                    'Десерты': [
                        { name: 'Медовик', price: '200', icon: '🍰', description: 'Медовый торт' },
                        { name: 'Блины', price: '180', icon: '🥞', description: 'С вареньем' }
                    ],
                        'Напитки': [
                            { name: 'Квас', price: '100', icon: '🥤', description: 'Традиционный напиток' },
                            { name: 'Чай', price: '80', icon: '🍵', description: 'Черный чай' }
                        ]
        }
    },
    ar: {
        currency: '﷼',
            categories: {
            'المقبلات': [
                { name: 'حمص', price: '25', icon: '🥙', description: 'حمص بالطحينة' },
                { name: 'بابا غنوج', price: '28', icon: '🍆', description: 'باذنجان مهروس' },
                { name: 'فتوش', price: '30', icon: '🥗', description: 'سلطة فتوش' }
            ],
                'الأطباق الرئيسية': [
                    { name: 'كبسة', price: '45', icon: '🍚', description: 'أرز بالدجاج' },
                    { name: 'شاورما', price: '35', icon: '🌯', description: 'لحم مشوي' },
                    { name: 'مندي', price: '50', icon: '🍖', description: 'لحم مع الأرز' }
                ],
                    'الحلويات': [
                        { name: 'بقلاوة', price: '20', icon: '🍰', description: 'حلوى بالفستق' },
                        { name: 'كنافة', price: '25', icon: '🧀', description: 'حلوى بالجبن' }
                    ],
                        'المشروبات': [
                            { name: 'عصير', price: '15', icon: '🍊', description: 'عصير طازج' },
                            { name: 'قهوة عربية', price: '10', icon: '☕', description: 'قهوة تقليدية' }
                        ]
        }
    },
    hi: {
        currency: '₹',
            categories: {
            'स्टार्टर': [
                { name: 'समोसा', price: '40', icon: '🥟', description: 'तला हुआ स्नैक' },
                { name: 'पकोड़ा', price: '60', icon: '🍤', description: 'तले हुए पकोड़े' },
                { name: 'चाट', price: '50', icon: '🥗', description: 'मसालेदार स्नैक' }
            ],
                'मुख्य व्यंजन': [
                    { name: 'बटर चिकन', price: '280', icon: '🍗', description: 'क्रीमी चिकन करी' },
                    { name: 'पनीर टिक्का मसाला', price: '220', icon: '🧀', description: 'पनीर करी' },
                    { name: 'बिरयानी', price: '250', icon: '🍚', description: 'मसालेदार चावल' }
                ],
                    'मिठाई': [
                        { name: 'गुलाब जामुन', price: '80', icon: '🍡', description: 'मीठे बॉल' },
                        { name: 'रसमलाई', price: '90', icon: '🍰', description: 'दूध की मिठाई' }
                    ],
                        'पेय': [
                            { name: 'लस्सी', price: '60', icon: '🥛', description: 'दही पेय' },
                            { name: 'चाय', price: '30', icon: '🍵', description: 'मसाला चाय' }
                        ]
        }
    }
};
