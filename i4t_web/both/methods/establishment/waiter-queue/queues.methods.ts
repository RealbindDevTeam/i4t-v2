import { Meteor } from 'meteor/meteor';
import { MongoObservable } from 'meteor-rxjs'
import { Job, JobCollection } from 'meteor/vsivsi:job-collection';
import { UserDetail } from '../../../models/auth/user-detail.model';
import { UserDetails } from '../../../collections/auth/user-detail.collection';
import { WaiterCallDetail } from '../../../models/establishment/waiter-call-detail.model';
import { WaiterCallDetails } from '../../../collections/establishment/waiter-call-detail.collection';
import { Establishment, EstablishmentTurn } from '../../../models/establishment/establishment.model';
import { Establishments, EstablishmentTurns } from '../../../collections/establishment/establishment.collection';
import { Queue, QueueName } from '../../../models/general/queue.model';
import { Queues } from '../../../collections/general/queue.collection';

if (Meteor.isServer) {

    /**
     * This function validate if exist queues and creates the instances correspondly
     */
    Meteor.startup(function () {

        let queues: Queue = Queues.findOne({});
        if (queues) {
            queues.queues.forEach(element => {
                Meteor.call('initProcessJobs', element);
            });
        }
    });

    Meteor.methods({

        /**
         * This Meteor Method allow find the queue corresponding to current establishment of the user
         * @param { any } _data
         */
        findQueueByEstablishment: function (_data: any) {
            let establishment = Establishments.findOne({ _id: _data.establishments });
            let queue = establishment.queue;
            let valEmpty: boolean = Number.isInteger(establishment.queue.length);
            let queueName: string = "";

            if (valEmpty && establishment.queue.length > 0) {
                let position = Meteor.call('getRandomInt', 0, establishment.queue.length - 1);
                if (establishment.queue[position] !== "") {
                    queueName = "queue" + position;
                    Meteor.call("queueValidate", queueName, _data, (err, result) => {
                        if (err) {
                            throw new Error("Error on Queue validating");
                        } else {
                            Meteor.call('waiterCall', queueName, false, _data);
                        }
                    });
                } else {
                    throw new Error("Error in call the waiter/waitress");
                }
            } else {
                throw new Error("Error in call the waiter/waitress");
            }
        },

        /**
         * This Meteor Method validate if exist queue in the collection
         * @param { string } _queue
         */
        queueValidate: function (_queue: string, _data: any) {
            let queueNew: QueueName = { name: _queue };;
            let queues: Queue = Queues.findOne({});
            if (queues) {
                let doc = Queues.findOne({ queues: { $elemMatch: { name: _queue } } });
                if (!doc) {
                    Queues.update({ _id: queues._id },
                        {
                            $addToSet: { queues: queueNew }
                        });
                    Meteor.call('initProcessJobs', queueNew, _data);
                }
            } else {
                Queues.insert({ queues: [queueNew] });
                Meteor.call('initProcessJobs', queueNew, _data);
            }
        },

        /**
         * This Meteor Method startup the queue and process jobs
         * @param { string } _queue
         */
        initProcessJobs(element: QueueName, _data: any) {
            let queueCollection = JobCollection(element.name);
            queueCollection.startJobServer();
            var workers = queueCollection.processJobs(
                'waiterCall',
                {
                    concurrency: 1,
                    payload: 1,
                    pollInterval: 1 * 1000,
                    prefetch: 1
                },
                function (job, callback) {
                    let queueName = element.name;
                    let data_detail: WaiterCallDetail;
                    let usr_id_enabled: UserDetail;

                    data_detail = WaiterCallDetails.findOne({ job_id: job._doc._id });
                    if (data_detail === undefined || data_detail === null) {
                        Meteor.call('waiterCall', queueName, false, _data);
                        data_detail = WaiterCallDetails.findOne({ job_id: job._doc._id });
                    }

                    let establishment = Establishments.findOne({ _id: data_detail.establishment_id });
                    usr_id_enabled = Meteor.call('validateWaiterEnabled', data_detail.establishment_id, establishment.max_jobs, data_detail.table_id);
                    if (usr_id_enabled === undefined || usr_id_enabled === null) {
                        Meteor.call('jobRemove', queueName, job._doc._id, data_detail);
                        usr_id_enabled = Meteor.call('validateWaiterEnabled', data_detail.establishment_id, establishment.max_jobs, data_detail.table_id);
                    }
                    job.done();
                    var toDate = new Date().toLocaleDateString();
                    EstablishmentTurns.update({ establishment_id: data_detail.establishment_id, creation_date: { $gte: new Date(toDate) } },
                        {
                            $set: { last_waiter_id: usr_id_enabled.user_id, modification_user: 'SYSTEM', modification_date: new Date(), }
                        });
                    //Waiter call detail update in completed state
                    WaiterCallDetails.update({ job_id: job._doc._id },
                        {
                            $set: { "waiter_id": usr_id_enabled.user_id, "status": "completed" }
                        });
                    //Waiter update of current jobs and state
                    let usr_jobs: number = usr_id_enabled.jobs + 1;
                    if (usr_jobs < establishment.max_jobs) {
                        UserDetails.update({ user_id: usr_id_enabled.user_id }, { $set: { "jobs": usr_jobs } });
                    } else if (usr_jobs == establishment.max_jobs) {
                        UserDetails.update({ user_id: usr_id_enabled.user_id }, { $set: { "enabled": false, "jobs": usr_jobs } });
                    }
                    callback();
                }
            );
        }
    });
}