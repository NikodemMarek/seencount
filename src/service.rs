use std::{cell::RefCell, thread::LocalKey};

use crate::{
    AppStateService, assets::Assets, contents_manipulation_service::ContentManipulationService,
    location::Locations,
};

thread_local! {
    static APP_STATE_SERVICE: RefCell<AppStateService> = RefCell::new(AppStateService::default());
    static LOCATIONS_SERVICE: RefCell<Locations> = RefCell::new(Locations::default());
    static ASSETS_SERVICE: RefCell<Assets> = RefCell::new(Assets::default());
    static CONTENT_MANIPULATION_SERVICE: RefCell<ContentManipulationService> = RefCell::new(ContentManipulationService::default());
}

pub(crate) trait Service: Sized
where
    Self: 'static,
{
    #[inline(always)]
    fn instance() -> &'static LocalKey<RefCell<Self>>;

    fn with<F, R>(f: F) -> R
    where
        F: FnOnce(&Self) -> R,
    {
        Self::instance().with(|cell| f(&cell.borrow()))
    }
    fn with_mut<F, R>(f: F) -> R
    where
        F: FnOnce(&mut Self) -> R,
    {
        Self::instance().with(|cell| f(&mut cell.borrow_mut()))
    }
}

impl Service for AppStateService {
    fn instance() -> &'static LocalKey<RefCell<Self>> {
        &APP_STATE_SERVICE
    }
}
impl Service for Locations {
    fn instance() -> &'static LocalKey<RefCell<Self>> {
        &LOCATIONS_SERVICE
    }
}
impl Service for Assets {
    fn instance() -> &'static LocalKey<RefCell<Self>> {
        &ASSETS_SERVICE
    }
}
impl Service for ContentManipulationService {
    fn instance() -> &'static LocalKey<RefCell<Self>> {
        &CONTENT_MANIPULATION_SERVICE
    }
}
