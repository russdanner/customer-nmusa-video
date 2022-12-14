import { crafterConf } from '@craftercms/classes';
import { SearchService } from '@craftercms/search';

import { nou } from '../utils';

export function searchByCategory(category) {
  const query = SearchService.createQuery('elasticsearch');
  const queryObj = {
    'query': category.query
  };

  if (!nou(category.numResults)) {
    queryObj.size = category.numResults;
  }

  if (!nou(category.sort)) {
    queryObj.sort = [{
      [category.sort.by]: {
        ...(
          category.sort.unmapped_type
            ? {'unmapped_type' : category.sort.unmapped_type}
            : {}
        )
        ,
        'order': category.sort.order
      }
    }];
  }

  query.query = queryObj;
  return SearchService.search(query, crafterConf.getConfig());
};