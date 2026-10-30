def resume(db):
    for job in db.query("select id from jobs where status = 'running'"):
        db.execute("update jobs set status = 'queued' where id = ?", job.id)
