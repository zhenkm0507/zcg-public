from typing import List
from framework.container.container_decorator import injectable
from framework.database.db_decorator import readonly, transactional
from framework.database.db_factory import get_db_session
from framework.util.logger import setup_logger
from incentive.domain.entity.award import Award

logger = setup_logger(__name__)

@injectable
class AwardService:
    @readonly
    def query_award_list(self) -> List[Award]:
        return get_db_session().query(Award).all()