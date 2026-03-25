export const syncInOrder = [
    'country',
    'city',
    'address',
    'store',
    'staff',      // staff depende de address y store
    'language',
    'actor',
    'category',
    'film',       // film depende de language
    'film_actor',
    'film_category',
    'inventory'   // inventory depende de film y store
];