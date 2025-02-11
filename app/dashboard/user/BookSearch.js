const BookSearch = () => {

    return (
        <>
        <div className='flex justify-between items-center p-5 bg-gray-100 text-white'>
          <div>
            <p className="text-4xl font-semibold text-purple-600">ค้นหาหนังสือ</p>
          </div>
          <div className='text-black'>
            <a href="/dashboard/user" className="no-underline hover:text-gray-300">หน้าแรก</a>
            <span className="mx-2">/</span>
            <a href="#" className="no-underline hover:text-gray-300">ค้นหาหนังสือ</a>
          </div>
        </div>

            <h2 className="text-black text-2xl">
                BookSearch Page
            </h2>
        </>
    );

};

export default BookSearch