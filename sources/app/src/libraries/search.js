import { crafterConf } from '@craftercms/classes';
import { SearchService } from '@craftercms/search';

import { isNullOrUndefined } from '../utils';

export function searchByCategory(category) {
  const query = SearchService.createQuery('elasticsearch');
  const queryObj = {
    'query': category.query
  };

  if (!isNullOrUndefined(category.numResults)) {
    queryObj.size = category.numResults;
  }

  if (!isNullOrUndefined(category.sort)) {
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